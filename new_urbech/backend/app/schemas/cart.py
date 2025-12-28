from pydantic import BaseModel
from typing import Optional
from app.schemas.product import Product

class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    user_id: int
    product: Optional[Product] = None

    class Config:
        from_attributes = True