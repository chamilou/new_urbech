# app/api/uploads.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import secrets
import os

# Use a single canonical media dir from config
# Make sure app/core/config.py defines:
#   PROJECT_ROOT = Path(__file__).resolve().parents[2]
#   MEDIA_ROOT = PROJECT_ROOT / "media"
#   MEDIA_PRODUCTS_DIR = MEDIA_ROOT / "products"
from app.core.config import BLOG_DIR, PRODUCT_DIR, MEDIA_ROOT
from app.api.auth import require_admin

router = APIRouter()

# Allowed content types -> file extension
EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))


def sniff_image_extension(header: bytes) -> str | None:
    if header.startswith(b"\xFF\xD8\xFF"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return ".webp"
    return None

@router.post("/products")
async def upload_product_image(file: UploadFile = File(...), _admin=Depends(require_admin)):
    # Validate type
    if file.content_type not in EXT_BY_MIME:
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, WebP)")

    header = await file.read(16)
    await file.seek(0)
    detected_ext = sniff_image_extension(header)
    expected_ext = EXT_BY_MIME[file.content_type]
    if detected_ext != expected_ext:
        raise HTTPException(status_code=400, detail="Uploaded file content does not match its image type")

    # Ensure dir exists
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate safe filename by content-type (don’t trust original name)
    filename = f"{secrets.token_hex(16)}{expected_ext}"
    dest: Path = PRODUCT_DIR / filename

    # Stream to disk
    try:
        with dest.open("wb") as f:
            total_written = 0
            while chunk := await file.read(1024 * 1024):
                total_written += len(chunk)
                if total_written > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Image exceeds the 5 MB upload limit")
                f.write(chunk)
    except HTTPException:
        if dest.exists():
            dest.unlink()
        raise
    except Exception as e:
        if dest.exists():
            dest.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    finally:
        await file.close()

    # IMPORTANT: Return a URL that matches your StaticFiles mount
    # Example: app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")
    return JSONResponse({
        "filename": filename,
        "url": f"/media/products/{filename}"
    })


@router.post("/blog")
async def upload_blog_image(file: UploadFile = File(...), _admin=Depends(require_admin)):
    if file.content_type not in EXT_BY_MIME:
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, WebP)")

    header = await file.read(16)
    await file.seek(0)
    detected_ext = sniff_image_extension(header)
    expected_ext = EXT_BY_MIME[file.content_type]
    if detected_ext != expected_ext:
        raise HTTPException(status_code=400, detail="Uploaded file content does not match its image type")

    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{secrets.token_hex(16)}{expected_ext}"
    dest: Path = BLOG_DIR / filename

    try:
        with dest.open("wb") as f:
            total_written = 0
            while chunk := await file.read(1024 * 1024):
                total_written += len(chunk)
                if total_written > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Image exceeds the 5 MB upload limit")
                f.write(chunk)
    except HTTPException:
        if dest.exists():
            dest.unlink()
        raise
    except Exception as e:
        if dest.exists():
            dest.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    finally:
        await file.close()

    return JSONResponse({
        "filename": filename,
        "url": f"/media/blog/{filename}"
    })


# Optional: direct fetch (StaticFiles already handles /media/**)
@router.get("/products/{filename}")
async def get_product_image(filename: str):
    path = PRODUCT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)
