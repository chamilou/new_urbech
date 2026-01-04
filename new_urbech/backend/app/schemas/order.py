# app/schemas/order.py
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional
from datetime import datetime

# -------- Checkout DTOs --------

class CheckoutItem(BaseModel):
    product_id: Optional[str] = None
    variant_id: Optional[str] = None
    quantity: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_choice(self):
        if not self.product_id and not self.variant_id:
            raise ValueError("Either product_id or variant_id is required")
        if self.product_id and self.variant_id:
            raise ValueError("Provide only one: product_id or variant_id")
        return self


class AddressInput(BaseModel):
    # Optional metadata
    label: Optional[str] = None
    company: Optional[str] = None

    # Person
    firstName: Optional[str] = None
    lastName: Optional[str] = None

    # Required core
    street1: str
    city: str
    country: str

    # Optional
    street2: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    countryCode: Optional[str] = None
    phone: Optional[str] = None


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]

    # optional if user is logged in
    user_id: Optional[str] = None
    customer_id: Optional[str] = None

    # optional address links (existing)
    shipping_address_id: Optional[str] = None
    billing_address_id: Optional[str] = None

    # NEW: allow address objects (backend can create snapshots)
    shipping_address: Optional[AddressInput] = None
    billing_address: Optional[AddressInput] = None

    # If user is logged in and you want to store shipping address in user profile
    save_address: Optional[bool] = False

    # optional guest fields
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None

    # optional override; normally derived from products/variants
    currency_code: Optional[str] = None

    @model_validator(mode="after")
    def validate_addresses(self):
        # Don't allow both id and object for the same address type
        if self.shipping_address_id and self.shipping_address:
            raise ValueError("Provide only one: shipping_address_id or shipping_address")
        if self.billing_address_id and self.billing_address:
            raise ValueError("Provide only one: billing_address_id or billing_address")

        # Optional: if neither guest email nor user_id provided, block anonymous orders
        # (enable if you want strictness)
        # if not self.user_id and not self.customer_email:
        #     raise ValueError("Either user_id or customer_email is required")

        return self


class CheckoutResponse(BaseModel):
    id: str
    orderNumber: str

    status: str
    paymentStatus: str
    fulfillment: str

    currencyCode: str
    subtotal: float
    discountTotal: float
    shippingTotal: float
    taxTotal: float
    total: float


# -------- Order read DTOs (for /orders/{id}) --------

class OrderItemOut(BaseModel):
    id: str
    productId: Optional[str] = None
    variantId: Optional[str] = None

    name: str
    sku: Optional[str] = None
    unitPrice: float
    quantity: int
    taxRate: Optional[float] = None
    discount: float
    total: float


class OrderOut(BaseModel):
    id: str
    orderNumber: str

    userId: Optional[str] = None
    customerId: Optional[str] = None

    currencyCode: str
    subtotal: float
    discountTotal: float
    shippingTotal: float
    taxTotal: float
    total: float

    status: str
    paymentStatus: str
    fulfillment: str

    customerEmail: Optional[str] = None
    customerName: Optional[str] = None

    shippingAddressId: Optional[str] = None
    billingAddressId: Optional[str] = None

    createdAt: datetime
    updatedAt: datetime

    items: List[OrderItemOut] = []
