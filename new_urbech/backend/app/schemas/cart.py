from pydantic import BaseModel
from typing import Optional
from app.schemas.product import Product

class CartItemBase(BaseModel):
    productId: str
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: str
    userId: str
    product: Optional[Product] = None

    class Config:
        from_attributes = True
