from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from pathlib import Path
from fnmatch import fnmatch
import json
from app.api.auth import require_admin

router = APIRouter()

SETTINGS_PATH = Path(__file__).resolve().parents[1] / "core" / "seo_settings.json"

class SeoSettings(BaseModel):
    excludes: dict[str, bool]

def read_settings():
    if not SETTINGS_PATH.exists():
        return {"excludes": {}}
    return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))

def write_settings(data: dict):
    SETTINGS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

@router.get("/seo")
async def get_seo_settings(_admin=Depends(require_admin)):
    return read_settings()

@router.put("/seo")
async def update_seo_settings(payload: SeoSettings, _admin=Depends(require_admin)):
    data = payload.model_dump()
    write_settings(data)
    return {"ok": True, "value": data}

@router.get("/sitemap/config")
async def sitemap_config():
    settings = read_settings()
    ex = settings.get("excludes", {})

    exclude_paths = []
    if ex.get("admin"):
        exclude_paths += ["/admin", "/admin/*"]
    if ex.get("cart"):
        exclude_paths.append("/cart")
    if ex.get("profile"):
        exclude_paths.append("/profile")
    if ex.get("shipping"):
        exclude_paths.append("/shipping")
    if ex.get("login"):
        exclude_paths.append("/login")
    if ex.get("register"):
        exclude_paths.append("/register")
    if ex.get("orders"):
        exclude_paths.append("/orders/*")

    return {"exclude": exclude_paths}


def build_exclude_paths(ex: dict) -> list[str]:
    exclude_paths = []
    if ex.get("admin"):
        exclude_paths += ["/admin", "/admin/*"]
    if ex.get("cart"):
        exclude_paths.append("/cart")
    if ex.get("profile"):
        exclude_paths.append("/profile")
    if ex.get("shipping"):
        exclude_paths.append("/shipping")
    if ex.get("login"):
        exclude_paths.append("/login")
    if ex.get("register"):
        exclude_paths.append("/register")
    if ex.get("orders"):
        exclude_paths.append("/orders/*")
    return exclude_paths

def is_excluded(path: str, patterns: list[str]) -> bool:
    # path like "/admin/products"
    return any(fnmatch(path, pat) for pat in patterns)
