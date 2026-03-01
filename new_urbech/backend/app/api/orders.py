from fastapi import APIRouter, Depends, HTTPException, Query
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from app.db.session import prisma
from app.api.auth import require_admin
from app.schemas.order import (
    AdminOrderResponse,
    AdminOrderUpsert,
    CheckoutRequest,
    CheckoutResponse,
    OrderItemOut,
)

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


def order_item_to_response(item) -> OrderItemOut:
    return OrderItemOut(
        id=item.id,
        productId=item.productId,
        variantId=item.variantId,
        name=item.name,
        sku=item.sku,
        unitPrice=float(item.unitPrice),
        quantity=item.quantity,
        taxRate=float(item.taxRate) if item.taxRate is not None else None,
        discount=float(item.discount),
        total=float(item.total),
    )


def order_to_response(order) -> AdminOrderResponse:
    items = [order_item_to_response(item) for item in getattr(order, "items", [])]
    return AdminOrderResponse(
        id=order.id,
        orderNumber=order.orderNumber,
        customerId=order.customerId,
        customerName=order.customerName,
        customerEmail=order.customerEmail,
        currencyCode=order.currencyCode,
        subtotal=float(order.subtotal),
        discountTotal=float(order.discountTotal),
        shippingTotal=float(order.shippingTotal),
        taxTotal=float(order.taxTotal),
        total=float(order.total),
        status=order.status,
        paymentStatus=order.paymentStatus,
        fulfillment=order.fulfillment,
        paymentMode=order.paymentMode,
        sendingAgent=order.sendingAgent,
        city=order.city,
        location=order.location,
        createdAt=order.createdAt,
        updatedAt=order.updatedAt,
        itemCount=len(items),
        items=items,
    )


def build_admin_order_data(payload: AdminOrderUpsert):
    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    tax_total = Decimal("0.00")
    order_items_create = []

    for item in payload.items:
        quantity = Decimal(item.quantity)
        unit_price = money(Decimal(str(item.unitPrice)))
        line_subtotal = money(unit_price * quantity)
        discount = money(Decimal(str(item.discount)))
        taxable = money(line_subtotal - discount)
        tax_rate = Decimal(str(item.taxRate))
        line_tax = money(taxable * (tax_rate / Decimal("100.00")))
        line_total = money(taxable + line_tax)

        subtotal += line_subtotal
        discount_total += discount
        tax_total += line_tax

        order_items_create.append(
            {
                "name": item.name,
                "sku": item.sku,
                "unitPrice": unit_price,
                "quantity": item.quantity,
                "taxRate": tax_rate,
                "discount": discount,
                "total": line_total,
            }
        )

    subtotal = money(subtotal)
    discount_total = money(discount_total)
    tax_total = money(tax_total)
    shipping_total = money(Decimal(str(payload.shippingTotal)))
    total = money(subtotal - discount_total + shipping_total + tax_total)

    data = {
        "customerId": payload.customerId,
        "customerEmail": payload.customerEmail,
        "customerName": payload.customerName,
        "currencyCode": payload.currencyCode.upper(),
        "subtotal": subtotal,
        "discountTotal": discount_total,
        "shippingTotal": shipping_total,
        "taxTotal": tax_total,
        "total": total,
        "status": payload.status,
        "paymentStatus": payload.paymentStatus,
        "fulfillment": payload.fulfillment,
        "paymentMode": payload.paymentMode,
        "sendingAgent": payload.sendingAgent,
        "city": payload.city,
        "location": payload.location,
    }
    data = {key: value for key, value in data.items() if value is not None}
    return data, order_items_create

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


@router.get("/", response_model=list[AdminOrderResponse])
async def list_orders(
    search: str | None = Query(None),
    _admin=Depends(require_admin),
):
    where = {}
    if search and search.strip():
        term = search.strip()
        or_filters = [
            {"orderNumber": {"contains": term, "mode": "insensitive"}},
            {"customerName": {"contains": term, "mode": "insensitive"}},
            {"customerEmail": {"contains": term, "mode": "insensitive"}},
        ]
        upper_term = term.upper()
        if upper_term in {"DRAFT", "PENDING", "PAYMENT_FAILED", "PAID", "FULFILLING", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"}:
            or_filters.append({"status": {"equals": upper_term}})
        where = {"OR": or_filters}

    orders = await prisma.order.find_many(
        where=where,
        include={"items": True, "customer": True},
        order={"createdAt": "desc"},
    )
    return [order_to_response(order) for order in orders]


@router.post("/", response_model=AdminOrderResponse)
async def create_order(payload: AdminOrderUpsert, _admin=Depends(require_admin)):
    customer = None
    if payload.customerId:
        customer = await prisma.customer.find_unique(where={"id": payload.customerId})
        if not customer:
            raise HTTPException(status_code=400, detail="Customer not found")

    data, order_items_create = build_admin_order_data(payload)
    order_number = payload.orderNumber or await generate_order_number()
    existing_by_order_number = await prisma.order.find_unique(where={"orderNumber": order_number})
    if existing_by_order_number:
        raise HTTPException(status_code=400, detail="Order number already exists")

    data["orderNumber"] = order_number
    if customer:
        data["customerEmail"] = payload.customerEmail or customer.email
        data["customerName"] = payload.customerName or customer.name
    data["items"] = {"create": order_items_create}

    created = await prisma.order.create(
        data=data,
        include={"items": True, "customer": True},
    )
    return order_to_response(created)


@router.put("/{order_id}", response_model=AdminOrderResponse)
async def update_order(order_id: str, payload: AdminOrderUpsert, _admin=Depends(require_admin)):
    existing = await prisma.order.find_unique(
        where={"id": order_id},
        include={"items": True, "customer": True},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = None
    if payload.customerId:
        customer = await prisma.customer.find_unique(where={"id": payload.customerId})
        if not customer:
            raise HTTPException(status_code=400, detail="Customer not found")

    data, order_items_create = build_admin_order_data(payload)
    if payload.orderNumber:
        conflict = await prisma.order.find_unique(where={"orderNumber": payload.orderNumber})
        if conflict and conflict.id != order_id:
            raise HTTPException(status_code=400, detail="Order number already exists")
        data["orderNumber"] = payload.orderNumber
    if customer:
        data["customerEmail"] = payload.customerEmail or customer.email
        data["customerName"] = payload.customerName or customer.name
    data["items"] = {
        "deleteMany": {},
        "create": order_items_create,
    }

    updated = await prisma.order.update(
        where={"id": order_id},
        data=data,
        include={"items": True, "customer": True},
    )
    return order_to_response(updated)


@router.delete("/{order_id}")
async def delete_order(order_id: str, _admin=Depends(require_admin)):
    existing = await prisma.order.find_unique(where={"id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")

    await prisma.order.delete(where={"id": order_id})
    return {"message": "Order deleted successfully"}
