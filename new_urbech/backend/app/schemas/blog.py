from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class BlogArticleBase(BaseModel):
    title: str = Field(min_length=3)
    slug: Optional[str] = None
    excerpt: str = Field(min_length=10)
    body: str = Field(min_length=30)
    coverImageUrl: Optional[str] = None
    galleryImageUrls: List[str] = Field(default_factory=list)
    published: bool = False


class BlogArticleCreate(BlogArticleBase):
    pass


class BlogArticleUpdate(BlogArticleBase):
    pass


class BlogArticleResponse(BlogArticleBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    readingTime: str


class BlogArticleListItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    coverImageUrl: Optional[str] = None
    published: bool
    createdAt: datetime
    updatedAt: datetime
    readingTime: str
