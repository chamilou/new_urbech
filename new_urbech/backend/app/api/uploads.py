# app/api/uploads.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import secrets
import shutil

# Use a single canonical media dir from config
# Make sure app/core/config.py defines:
#   PROJECT_ROOT = Path(__file__).resolve().parents[2]
#   MEDIA_ROOT = PROJECT_ROOT / "media"
#   MEDIA_PRODUCTS_DIR = MEDIA_ROOT / "products"
from app.core.config import PRODUCT_DIR, MEDIA_ROOT

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Allowed content types -> file extension
EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

@router.post("/products")
async def upload_product_image(file: UploadFile = File(...)):
    # Validate type
    if file.content_type not in EXT_BY_MIME:
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, WebP)")

    # Ensure dir exists
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate safe filename by content-type (don’t trust original name)
    ext = EXT_BY_MIME[file.content_type]
    filename = f"{secrets.token_hex(16)}{ext}"
    dest: Path = PRODUCT_DIR / filename

    # Stream to disk
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    # IMPORTANT: Return a URL that matches your StaticFiles mount
    # Example: app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")
    return JSONResponse({
        "filename": filename,
        "url": f"/media/products/{filename}"
    })


# Optional: direct fetch (StaticFiles already handles /media/**)
@router.get("/products/{filename}")
async def get_product_image(filename: str):
    path = PRODUCT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
