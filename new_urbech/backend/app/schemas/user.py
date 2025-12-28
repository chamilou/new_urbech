from pydantic import BaseModel, EmailStr,Field
from datetime import datetime
from typing import Optional



class UserBase(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    name: Optional[str] = Field(None, example="John Doe")

class UserCreate(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=6, example="securepassword123")
    name: Optional[str] = Field(None, example="John Doe")

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, example="John Doe")
    email: Optional[EmailStr] = Field(None, example="user@example.com")

class UserInDB(UserBase):
    id: int
    password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., example="securepassword123")
