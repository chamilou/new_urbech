# app/schemas/product.py
from __future__ import annotations

from decimal import Decimal
from datetime import datetime
from typing import List, Optional, Any

from pydantic import BaseModel, Field, field_validator
from typing_extensions import Annotated
from pydantic.types import StringConstraints
from urllib.parse import urlparse


# Helper types (Pydantic v2 style)
Slug = Annotated[
    str,
    StringConstraints(pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$', strip_whitespace=True),
]
CurrencyCode = Annotated[
    str,
    StringConstraints(pattern=r'^[A-Z]{3}$', strip_whitespace=True),
]


# Sub-models for relationships
class CategoryRef(BaseModel):
    id: str
    name: str
    slug: str

class ProductCategory(BaseModel):
    category: CategoryRef

class ProductImage(BaseModel):
    id: str
    url: str


class ProductBase(BaseModel):
    # basic
    name: str
    slug: Optional[Slug] = None
    description: Optional[str] = None

    # money — accept both Decimal and string for flexibility
    price: Optional[Decimal] = Field(
        default=None, max_digits=12, decimal_places=2, description="e.g., 12.50"
    )
    currencyCode: Optional[CurrencyCode] = None

    # inventory
    stock: Optional[int] = 0
    minStock: Optional[int] = 5

    # misc attributes
    articleNumber: Optional[str] = None
    weightGrams: Optional[int] = None

    # dimensions as Decimal with up to 2 decimals
    lengthCm: Optional[Decimal] = Field(default=None, max_digits=8, decimal_places=2)
    widthCm: Optional[Decimal] = Field(default=None, max_digits=8, decimal_places=2)
    heightCm: Optional[Decimal] = Field(default=None, max_digits=8, decimal_places=2)

    color: Optional[str] = None

    # keep URL as str
    mainImageUrl: Optional[str] = None
    @field_validator("mainImageUrl", mode="before")
    @classmethod
    def validate_main_image_url(cls, v):
        if v is None or v == "":
            return None

        v = v.strip()

        # Allow local uploaded media
        if v.startswith("/media/"):
            return v

        # Allow absolute HTTPS URLs (optional)
        parsed = urlparse(v)
        if parsed.scheme == "https" and parsed.netloc:
            return v

        # (optional) allow http only in dev
        # if parsed.scheme == "http":
        #     return v

        raise ValueError(
            "mainImageUrl must be '/media/...' or a valid HTTPS URL"
        )

    # taxonomy (either list can be provided)
    categoryIds: Optional[List[str]] = None
    categorySlugs: Optional[List[str]] = None

    # media
    imageUrls: Optional[List[str]] = None  # extra gallery images


class ProductCreate(ProductBase):
    # 'name' required for create
    name: str


class ProductUpdate(ProductBase):
    # allow partial updates
    name: Optional[str] = None


class Product(ProductBase):
    id: str
    name: str
    slug: str
    # FIX: Accept both Decimal and string for price
    price: Optional[Any] = None
    currencyCode: Optional[str] = None
    stock: int
    minStock: int
    
    # FIX: Accept datetime objects for createdAt/updatedAt
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    # Categories and images from relations
    categories: Optional[List[ProductCategory]] = None
    images: Optional[List[ProductImage]] = None

    # Validators to handle various input types
    @field_validator('price', mode='before')
    @classmethod
    def validate_price(cls, v):
        if v is None:
            return None
        # If it's already a Decimal, keep it
        if isinstance(v, Decimal):
            return v
        # If it's a string, convert to Decimal
        if isinstance(v, str):
            try:
                return Decimal(v)
            except:
                return None
        # If it's a float or int, convert to Decimal
        if isinstance(v, (float, int)):
            return Decimal(str(v))
        return v

    @field_validator('createdAt', 'updatedAt', mode='before')
    @classmethod
    def validate_datetime(cls, v):
        if v is None:
            return None
        # If it's already datetime, keep it
        if isinstance(v, datetime):
            return v
        # If it's string, try to parse
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except:
                return None
        return v

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: str(v) if v is not None else None,
            datetime: lambda v: v.isoformat() if v is not None else None
        }

class ProductQueryParams(BaseModel):
    skip: Optional[int] = 0
    limit: Optional[int] = 100
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    featured: Optional[bool] = None
    new: Optional[bool] = None
    recent: Optional[bool] = None
    search: Optional[str] = None
    sort_by: Optional[str] = None
# Optional: Create a simplified response model if needed
class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    price: Optional[str] = None
    currencyCode: Optional[str] = None
    stock: int
    minStock: int
    description: Optional[str] = None
    mainImageUrl: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    categories: Optional[List[CategoryRef]] = None
    images: Optional[List[ProductImage]] = None
    

    @classmethod
    def from_product(cls, product: Product):
        """Convert Product to ProductResponse"""
        # Extract categories from the nested structure
        categories = None
        if product.categories:
            categories = [pc.category for pc in product.categories]
        
        return cls(
            id=product.id,
            name=product.name,
            slug=product.slug,
            price=str(product.price) if product.price else None,
            currencyCode=product.currencyCode,
            stock=product.stock,
            minStock=product.minStock,
            description=product.description,
            mainImageUrl=product.mainImageUrl,
            createdAt=product.createdAt.isoformat() if product.createdAt else None,
            updatedAt=product.updatedAt.isoformat() if product.updatedAt else None,
            categories=categories,
            images=product.images
        )
    @classmethod
    def from_prisma(cls, product: "Product"):
        """
        Accept the dict/object returned by Prisma .find_* with
        include={"categories": {"include": {"category": True}}, "images": True}
        and convert to ProductResponse.
        """
        # categories come as [{"category": {id,name,slug}}, ...]
        categories = None
        if product and getattr(product, "categories", None):
            categories = []
            for pc in product.categories:
                cat = getattr(pc, "category", None) or (pc.get("category") if isinstance(pc, dict) else None)
                if cat:
                    categories.append(CategoryRef(id=cat["id"] if isinstance(cat, dict) else cat.id,
                                                  name=cat["name"] if isinstance(cat, dict) else cat.name,
                                                  slug=cat["slug"] if isinstance(cat, dict) else cat.slug))

        # images come as [{"id": ..., "url": ...}, ...]
        images = None
        if product and getattr(product, "images", None):
            images = []
            for im in product.images:
                if isinstance(im, dict):
                    images.append(ProductImage(id=im["id"], url=im["url"]))
                else:
                    images.append(ProductImage(id=im.id, url=im.url))

        # pull datetimes if present
        created = getattr(product, "createdAt", None)
        updated = getattr(product, "updatedAt", None)

        # price can be Decimal/str/None
        price_val = getattr(product, "price", None)
        price_str = str(price_val) if price_val is not None else None

        return cls(
            id=(product["id"] if isinstance(product, dict) else product.id),
            name=(product["name"] if isinstance(product, dict) else product.name),
            slug=(product["slug"] if isinstance(product, dict) else product.slug),
            price=price_str,
            currencyCode=(product["currencyCode"] if isinstance(product, dict) else getattr(product, "currencyCode", None)),
            stock=(product["stock"] if isinstance(product, dict) else product.stock),
            minStock=(product["minStock"] if isinstance(product, dict) else getattr(product, "minStock", None)),
            description=(product["description"] if isinstance(product, dict) else getattr(product, "description", None)),
            mainImageUrl=(product["mainImageUrl"] if isinstance(product, dict) else getattr(product, "mainImageUrl", None)),
            createdAt=(created.isoformat() if hasattr(created, "isoformat") else created),
            updatedAt=(updated.isoformat() if hasattr(updated, "isoformat") else updated),
            categories=categories,
            images=images,
        )
