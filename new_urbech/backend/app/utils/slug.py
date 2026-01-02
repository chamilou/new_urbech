# app/utils/slug.py
from __future__ import annotations
from typing import Optional, Callable, Awaitable

from slugify import slugify

def make_slug(text: str) -> str:
    return slugify(text or "", lowercase=True) or ""

async def ensure_unique_slug(
    base_slug: str,
    exists: Callable[[str], Awaitable[bool]],
    *,
    current_id: Optional[str] = None,
) -> str:
    """
    Ensure slug is unique by appending -2, -3, ...
    `exists(slug)` should return True if slug is taken by *another* record.
    """
    slug = base_slug
    if not slug:
        return ""

    if not await exists(slug):
        return slug

    i = 2
    while True:
        candidate = f"{base_slug}-{i}"
        if not await exists(candidate):
            return candidate
        i += 1
