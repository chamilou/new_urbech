import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import require_admin
from app.schemas.blog import (
    BlogArticleCreate,
    BlogArticleListItem,
    BlogArticleResponse,
    BlogArticleUpdate,
)
from app.utils.slug import make_slug

router = APIRouter()

BLOG_PATH = Path(__file__).resolve().parents[1] / "core" / "blog_articles.json"


def read_articles() -> list[dict]:
    if not BLOG_PATH.exists():
        return []
    return json.loads(BLOG_PATH.read_text(encoding="utf-8"))


def write_articles(articles: list[dict]) -> None:
    BLOG_PATH.write_text(json.dumps(articles, indent=2, ensure_ascii=False), encoding="utf-8")


def compute_reading_time(text: str) -> str:
    words = max(1, len((text or "").split()))
    minutes = max(1, round(words / 180))
    return f"{minutes} мин чтения"


def normalize_article(article: dict) -> dict:
    normalized = dict(article)
    normalized["galleryImageUrls"] = normalized.get("galleryImageUrls") or []
    normalized["coverImageUrl"] = normalized.get("coverImageUrl") or None
    normalized["readingTime"] = compute_reading_time(normalized.get("body", ""))
    return normalized


def ensure_unique_slug(articles: list[dict], slug: str, current_id: str | None = None) -> str:
    base_slug = make_slug(slug)
    if not base_slug:
        raise HTTPException(status_code=400, detail="Invalid article slug")

    existing_slugs = {
        article["slug"]
        for article in articles
        if article.get("id") != current_id
    }

    if base_slug not in existing_slugs:
        return base_slug

    index = 2
    while True:
        candidate = f"{base_slug}-{index}"
        if candidate not in existing_slugs:
            return candidate
        index += 1


def serialize_list_item(article: dict) -> BlogArticleListItem:
    normalized = normalize_article(article)
    return BlogArticleListItem(**normalized)


def serialize_article(article: dict) -> BlogArticleResponse:
    normalized = normalize_article(article)
    return BlogArticleResponse(**normalized)


@router.get("/", response_model=list[BlogArticleListItem])
async def list_blog_articles():
    articles = [article for article in read_articles() if article.get("published")]
    articles.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    return [serialize_list_item(article) for article in articles]


@router.get("/admin", response_model=list[BlogArticleResponse])
async def list_blog_articles_admin(_admin=Depends(require_admin)):
    articles = read_articles()
    articles.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    return [serialize_article(article) for article in articles]


@router.get("/slug/{slug}", response_model=BlogArticleResponse)
async def get_blog_article(slug: str):
    for article in read_articles():
        if article.get("slug") == slug and article.get("published"):
            return serialize_article(article)
    raise HTTPException(status_code=404, detail="Article not found")


@router.post("/", response_model=BlogArticleResponse)
async def create_blog_article(payload: BlogArticleCreate, _admin=Depends(require_admin)):
    articles = read_articles()
    now = datetime.now(timezone.utc).isoformat()
    slug = ensure_unique_slug(articles, payload.slug or payload.title)
    article = {
        "id": uuid4().hex,
        "slug": slug,
        "title": payload.title.strip(),
        "excerpt": payload.excerpt.strip(),
        "body": payload.body.strip(),
        "coverImageUrl": payload.coverImageUrl,
        "galleryImageUrls": payload.galleryImageUrls,
        "published": payload.published,
        "createdAt": now,
        "updatedAt": now,
    }
    articles.append(article)
    write_articles(articles)
    return serialize_article(article)


@router.put("/{article_id}", response_model=BlogArticleResponse)
async def update_blog_article(article_id: str, payload: BlogArticleUpdate, _admin=Depends(require_admin)):
    articles = read_articles()
    for index, article in enumerate(articles):
        if article.get("id") != article_id:
            continue

        slug = ensure_unique_slug(articles, payload.slug or payload.title, current_id=article_id)
        updated = {
            **article,
            "slug": slug,
            "title": payload.title.strip(),
            "excerpt": payload.excerpt.strip(),
            "body": payload.body.strip(),
            "coverImageUrl": payload.coverImageUrl,
            "galleryImageUrls": payload.galleryImageUrls,
            "published": payload.published,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        articles[index] = updated
        write_articles(articles)
        return serialize_article(updated)

    raise HTTPException(status_code=404, detail="Article not found")


@router.delete("/{article_id}")
async def delete_blog_article(article_id: str, _admin=Depends(require_admin)):
    articles = read_articles()
    remaining = [article for article in articles if article.get("id") != article_id]
    if len(remaining) == len(articles):
        raise HTTPException(status_code=404, detail="Article not found")
    write_articles(remaining)
    return {"message": "Article deleted successfully"}
