# app/schemas/order.py
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime

ORDER_STATUSES = {"DRAFT", "PENDING", "PAYMENT_FAILED", "PAID", "FULFILLING", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"}
PAYMENT_STATUSES = {"PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"}
FULFILLMENT_STATUSES = {"UNFULFILLED", "PARTIAL", "FULFILLED"}

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


class AdminOrderItemInput(BaseModel):
    name: str = Field(min_length=1)
    sku: Optional[str] = None
    unitPrice: float = Field(ge=0)
    quantity: int = Field(ge=1)
    taxRate: float = Field(default=0, ge=0)
    discount: float = Field(default=0, ge=0)


class AdminOrderUpsert(BaseModel):
    orderNumber: Optional[str] = None
    customerId: Optional[str] = None
    customerEmail: Optional[str] = None
    customerName: Optional[str] = None
    currencyCode: str = Field(min_length=3, max_length=3)
    status: str
    paymentStatus: str
    fulfillment: str
    paymentMode: Optional[str] = None
    sendingAgent: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    shippingTotal: float = Field(default=0, ge=0)
    items: List[AdminOrderItemInput] = Field(default_factory=list)

    @field_validator("currencyCode")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in ORDER_STATUSES:
            raise ValueError("Invalid order status")
        return normalized

    @field_validator("paymentStatus")
    @classmethod
    def validate_payment_status(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in PAYMENT_STATUSES:
            raise ValueError("Invalid payment status")
        return normalized

    @field_validator("fulfillment")
    @classmethod
    def validate_fulfillment(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in FULFILLMENT_STATUSES:
            raise ValueError("Invalid fulfillment status")
        return normalized


class AdminOrderResponse(BaseModel):
    id: str
    orderNumber: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    currencyCode: str
    subtotal: float
    discountTotal: float
    shippingTotal: float
    taxTotal: float
    total: float
    status: str
    paymentStatus: str
    fulfillment: str
    paymentMode: Optional[str] = None
    sendingAgent: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    itemCount: int
    items: List[OrderItemOut] = Field(default_factory=list)
