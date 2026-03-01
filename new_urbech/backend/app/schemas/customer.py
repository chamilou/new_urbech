from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    group: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    group: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: str
    createdAt: datetime
    orderCount: int = 0

