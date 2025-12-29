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

class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]

    # optional if user is logged in
    user_id: Optional[str] = None
    customer_id: Optional[str] = None

    # optional address links (you already have Address + relations)
    shipping_address_id: Optional[str] = None
    billing_address_id: Optional[str] = None

    # optional guest fields
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None

    # optional override; normally derived from products/variants
    currency_code: Optional[str] = None

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
