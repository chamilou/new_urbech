from fastapi import APIRouter, HTTPException
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from app.db.session import prisma
from app.schemas.order import CheckoutRequest, CheckoutResponse

router = APIRouter()

DEFAULT_CURRENCY = "CHF"
DEFAULT_TAX_RATE_PERCENT = Decimal("10.00")  # set to 0.00 if you want no tax for now

def money(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

async def generate_order_number() -> str:
    """
    Simple unique order number: YYYYMMDD-HHMMSS-XXXX
    You can replace with a DB sequence later.
    """
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    # small random-ish suffix from uuid
    import uuid
    suffix = uuid.uuid4().hex[:4].upper()
    return f"{stamp}-{suffix}"

@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(payload: CheckoutRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    product_ids = [i.product_id for i in payload.items if i.product_id]
    variant_ids = [i.variant_id for i in payload.items if i.variant_id]

    # Fetch products/variants
    products = []
    variants = []
    if product_ids:
        products = await prisma.product.find_many(
            where={"id": {"in": list(set(product_ids))}}
        )
    if variant_ids:
        variants = await prisma.productvariant.find_many(
            where={"id": {"in": list(set(variant_ids))}},
            include={"product": True},
        )

    product_map = {p.id: p for p in products}
    variant_map = {v.id: v for v in variants}

    # Validate existence
    missing_products = [pid for pid in set(product_ids) if pid not in product_map]
    missing_variants = [vid for vid in set(variant_ids) if vid not in variant_map]
    if missing_products or missing_variants:
        raise HTTPException(
            status_code=404,
            detail={
                "missing_products": missing_products,
                "missing_variants": missing_variants,
            },
        )

    # Build order items + totals
    subtotal = Decimal("0.00")
    tax_total = Decimal("0.00")
    order_items_create = []

    # Determine currency: if client sent, use it; otherwise derive from first item (basic v1)
    derived_currency = payload.currency_code

    for item in payload.items:
        qty = int(item.quantity)

        if item.variant_id:
            v = variant_map[item.variant_id]
            p = v.product
            name = p.name
            sku = v.sku
            unit_price = Decimal(str(v.price))
            currency = v.currencyCode or p.currencyCode or DEFAULT_CURRENCY
            product_id = p.id
            variant_id = v.id
        else:
            p = product_map[item.product_id]
            name = p.name
            sku = None
            unit_price = Decimal(str(p.price or "0"))
            currency = p.currencyCode or DEFAULT_CURRENCY
            product_id = p.id
            variant_id = None

        if derived_currency is None:
            derived_currency = currency

        # OPTIONAL: enforce single-currency carts (recommended)
        if derived_currency != currency:
            raise HTTPException(
                status_code=400,
                detail=f"Mixed currencies not supported in one order (got {derived_currency} and {currency})",
            )

        line_subtotal = money(unit_price * Decimal(qty))
        line_tax = money(line_subtotal * (DEFAULT_TAX_RATE_PERCENT / Decimal("100.00")))
        line_total = money(line_subtotal + line_tax)

        subtotal += line_subtotal
        tax_total += line_tax

        order_items_create.append(
            {
                "productId": product_id,
                "variantId": variant_id,
                "name": name,
                "sku": sku,
                "unitPrice": unit_price,
                "quantity": qty,
                "taxRate": DEFAULT_TAX_RATE_PERCENT,  # percent snapshot
                "discount": Decimal("0.00"),
                "total": line_total,
            }
        )

    subtotal = money(subtotal)
    tax_total = money(tax_total)

    discount_total = Decimal("0.00")
    shipping_total = Decimal("0.00")
    total = money(subtotal - discount_total + shipping_total + tax_total)

    order_number = await generate_order_number()

    order = await prisma.order.create(
        data={
            "orderNumber": order_number,
            "userId": payload.user_id,
            "customerId": payload.customer_id,
            "currencyCode": derived_currency or DEFAULT_CURRENCY,
            "subtotal": subtotal,
            "discountTotal": discount_total,
            "shippingTotal": shipping_total,
            "taxTotal": tax_total,
            "total": total,
            "status": "PENDING",
            "paymentStatus": "PENDING",
            "fulfillment": "UNFULFILLED",
            "shippingAddressId": payload.shipping_address_id,
            "billingAddressId": payload.billing_address_id,
            "customerEmail": payload.customer_email,
            "customerName": payload.customer_name,
            "items": {"create": order_items_create},
        }
    )

    return CheckoutResponse(
        id=order.id,
        orderNumber=order.orderNumber,
        status=order.status,
        paymentStatus=order.paymentStatus,
        fulfillment=order.fulfillment,
        currencyCode=order.currencyCode,
        subtotal=float(order.subtotal),
        taxTotal=float(order.taxTotal),
        shippingTotal=float(order.shippingTotal),
        discountTotal=float(order.discountTotal),
        total=float(order.total),
    )
@router.get("/{order_id}")
async def get_order(order_id: str):
    order = await prisma.order.find_unique(
        where={"id": order_id},
        include={"items": True},
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
