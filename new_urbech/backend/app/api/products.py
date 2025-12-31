from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Optional, Union
from decimal import Decimal, InvalidOperation
import csv
import io
import re
import unicodedata
from datetime import datetime, timedelta

from app.db.session import prisma
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

# ---------- helpers ----------
def slugify(value: str) -> str:
    """
    ASCII-only, lowercase, dash-separated slugifier.
    """
    v = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    v = re.sub(r"[^a-zA-Z0-9]+", "-", v).strip("-").lower()
    return v or "item"

async def resolve_categories(
    category_ids: Optional[List[str]],
    category_slugs: Optional[List[str]],
) -> List[str]:
    ids: List[str] = []
    if category_ids:
        existing = await prisma.category.find_many(where={"id": {"in": category_ids}})
        found_ids = {c.id for c in existing}
        missing = set(category_ids) - found_ids
        if missing:
            raise HTTPException(status_code=400, detail=f"Unknown categoryIds: {', '.join(missing)}")
        ids.extend(found_ids)

    if category_slugs:
        existing = await prisma.category.find_many(where={"slug": {"in": category_slugs}})
        if len(existing) != len(set(category_slugs)):
            found = {c.slug for c in existing}
            missing = [s for s in set(category_slugs) if s not in found]
            raise HTTPException(status_code=400, detail=f"Unknown categorySlugs: {', '.join(missing)}")
        ids.extend([c.id for c in existing])

    # de-dup while preserving order
    return list(dict.fromkeys(ids))

def to_decimal_str(val: Optional[Union[str, float, int, Decimal]]) -> Optional[str]:
    """
    Accept strings with comma or dot (EU/US), ints, floats, Decimal.
    Return string with exactly 2 decimal places for Prisma Decimal columns.
    Raise 422 on invalid inputs.
    """
    if val is None:
        return None
    if isinstance(val, str):
        v = val.strip().replace(",", ".")
        # allow empty string to mean null
        if v == "":
            return None
    else:
        v = str(val)
    try:
        d = Decimal(v)
    except InvalidOperation:
        raise HTTPException(status_code=422, detail=f"Invalid decimal value: {val!r}")
    return f"{d.quantize(Decimal('0.01'))}"

def price_filter(min_price: Optional[float], max_price: Optional[float]):
    if min_price is None and max_price is None:
        return None
    f = {}
    if min_price is not None:
        f["gte"] = str(min_price)
    if max_price is not None:
        f["lte"] = str(max_price)
    return f

# ---------- Response Models ----------
from pydantic import BaseModel

class PaginatedProductResponse(BaseModel):
    products: List[ProductResponse]
    total_count: int
    page: int
    total_pages: int
    has_next: bool
    has_prev: bool

# ---------- CRUD Endpoints ----------
async def get_category_ids_including_children_by_slug(category_slug: str) -> List[str]:
    cat = await prisma.category.find_unique(where={"slug": category_slug})
    if not cat:
        return []

    root_path = cat.path or cat.slug
    rows = await prisma.category.find_many(
    where={
        "OR": [
            {"id": cat.id},
            {"path": {"startsWith": f"{root_path}/"}},
                ]
                }
            )
    ids = [c.id for c in rows]
    return ids

   

    return [r["id"] for r in rows]


@router.get("/", response_model=PaginatedProductResponse)
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    include_children: bool = Query(False, description="Include products in subcategories"),

    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    # New filters for home page sections
    featured: Optional[bool] = Query(None, description="Filter featured/top products"),
    new: Optional[bool] = Query(None, description="Filter products from last 7 days"),
    recent: Optional[bool] = Query(None, description="Filter products from last 24 hours"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    sort_by: Optional[str] = Query(None, description="Sort by: newest, price_asc, price_desc, name")
):
    where = {}
    
    # Price filter (existing)
    pf = price_filter(min_price, max_price)
    if pf:
        where["price"] = pf

    # Category filters (existing)
    '''
    if category_id:
        where["categories"] = {"some": {"categoryId": category_id}}
    elif category_slug:
        where["categories"] = {"some": {"category": {"is": {"slug": category_slug}}}}

    '''
    # Category filters (updated with include_children)
    if category_id:
        where["categories"] = {"some": {"categoryId": category_id}}
    elif category_slug:
        if include_children:
            ids = await get_category_ids_including_children_by_slug(category_slug)
            if not ids:
                return PaginatedProductResponse(
                    products=[],
                    total_count=0,
                    page=(skip // limit) + 1,
                    total_pages=0,
                    has_next=False,
                    has_prev=False,
                )
            where["categories"] = {"some": {"categoryId": {"in": ids}}}
        else:
            cat = await prisma.category.find_unique(where={"slug": category_slug})
            if not cat:
                return PaginatedProductResponse(
                    products=[],
                    total_count=0,
                    page=(skip // limit) + 1,
                    total_pages=0,
                    has_next=False,
                    has_prev=False,
                )
            where["categories"] = {"some": {"categoryId": cat.id}}

    # New: Featured products filter
    if featured:
        where["OR"] = [
            {"isTopProduct": True},
            {"featured": True},
            {"is_popular": True},
            {"top_product": True}
        ]

    # New: Date-based filters
    if new:
        # Products from last 7 days
        week_ago = datetime.now() - timedelta(days=7)
        where["createdAt"] = {"gte": week_ago}
    elif recent:
        # Products from last 24 hours
        day_ago = datetime.now() - timedelta(hours=24)
        where["createdAt"] = {"gte": day_ago}

    # New: Search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        where["OR"] = [
            {"name": {"contains": search_term, "mode": "insensitive"}},
            {"description": {"contains": search_term, "mode": "insensitive"}}
        ]

    # New: Sorting
    order_by = {}
    if sort_by:
        if sort_by == "newest":
            order_by = {"createdAt": "desc"}
        elif sort_by == "price_asc":
            order_by = {"price": "asc"}
        elif sort_by == "price_desc":
            order_by = {"price": "desc"}
        elif sort_by == "name":
            order_by = {"name": "asc"}
    else:
        # Default sorting
        order_by = {"createdAt": "desc"}

    # Get total count for pagination
    total_count = await prisma.product.count(where=where)
    
    # Get products with pagination
    products = await prisma.product.find_many(
        skip=skip,
        take=limit,
        where=where,
        include={
            "categories": {"include": {"category": True}},
            "images": True,
        },
        order=order_by,
    )
    
    # Calculate pagination info
    current_page = (skip // limit) + 1
    total_pages = (total_count + limit - 1) // limit if limit > 0 else 1
    
    return PaginatedProductResponse(
        products=[ProductResponse.from_prisma(product) for product in products],
        total_count=total_count,
        page=current_page,
        total_pages=total_pages,
        has_next=current_page < total_pages,
        has_prev=current_page > 1
    )

# ---------- Home Page Endpoints ----------
@router.get("/home/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = Query(8, ge=1, le=20)):
    """Get featured products for home page"""
    products = await prisma.product.find_many(
        take=limit,
        where={
            "OR": [
                {"featured": True},
                {"isTopProduct": True},
              
            ]
        },
        include={
            "categories": {"include": {"category": True}},
            "images": True,
        },
        order={"createdAt": "desc"},
    )
    return [ProductResponse.from_prisma(product) for product in products]

@router.get("/home/new-arrivals", response_model=List[ProductResponse])
async def get_new_arrivals(limit: int = Query(8, ge=1, le=20)):
    """Get new arrivals (last 7 days) for home page"""
    week_ago = datetime.now() - timedelta(days=7)
    
    products = await prisma.product.find_many(
        take=limit,
        where={
            "createdAt": {"gte": week_ago}
        },
        include={
            "categories": {"include": {"category": True}},
            "images": True,
        },
        order={"createdAt": "desc"},
    )
    return [ProductResponse.from_prisma(product) for product in products]

@router.get("/home/recent", response_model=List[ProductResponse])
async def get_recent_products(limit: int = Query(8, ge=1, le=20)):
    """Get recently added products (last 24 hours) for home page"""
    day_ago = datetime.now() - timedelta(hours=24)
    
    products = await prisma.product.find_many(
        take=limit,
        where={
            "createdAt": {"gte": day_ago}
        },
        include={
            "categories": {"include": {"category": True}},
            "images": True,
        },
        order={"createdAt": "desc"},
    )
    return [ProductResponse.from_prisma(product) for product in products]

@router.get("/home/bestsellers", response_model=List[ProductResponse])
async def get_bestsellers(limit: int = Query(8, ge=1, le=20)):
    """Get bestseller products"""
    # For now, return popular/featured products
    # Later implement actual sales tracking
    products = await prisma.product.find_many(
        take=limit,
        where={
            "OR": [
                {"isTopProduct": True},
                {"featured": True},
                {"is_popular": True}
            ]
        },
        include={
            "categories": {"include": {"category": True}},
            "images": True,
        },
        order={"createdAt": "desc"},
    )
    return [ProductResponse.from_prisma(product) for product in products]

@router.post("/", response_model=ProductResponse)
async def create_product(body: ProductCreate):
    try:
        slug = body.slug or slugify(body.name)
        cat_ids = await resolve_categories(body.categoryIds, body.categorySlugs)

        data = {
            "name": body.name,
            "slug": slug,
            "description": body.description,
            "price": to_decimal_str(body.price) if body.price is not None else None,
            "currencyCode": body.currencyCode,
            "stock": body.stock or 0,
            "minStock": body.minStock or 5,
            "articleNumber": body.articleNumber,
            "weightGrams": body.weightGrams,
            "lengthCm": to_decimal_str(body.lengthCm) if body.lengthCm is not None else None,
            "widthCm": to_decimal_str(body.widthCm) if body.widthCm is not None else None,
            "heightCm": to_decimal_str(body.heightCm) if body.heightCm is not None else None,
            "color": body.color,
            "mainImageUrl": body.mainImageUrl,
            "categories": {"create": [{"category": {"connect": {"id": cid}}} for cid in cat_ids]} if cat_ids else None,
            "images": {"create": [{"url": u} for u in (body.imageUrls or [])]} if body.imageUrls else None,
        }
        data = {k: v for k, v in data.items() if v is not None}

        created = await prisma.product.create(
            data=data,
            include={"categories": {"include": {"category": True}}, "images": True},
        )
        return ProductResponse.from_prisma(created)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {e}")

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    prod = await prisma.product.find_unique(
        where={"id": product_id},
        include={"categories": {"include": {"category": True}}, "images": True},
    )
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.from_prisma(prod)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, body: ProductUpdate):
    existing = await prisma.product.find_unique(
        where={"id": product_id},
        include={"categories": True, "images": True},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    cat_ops = None
    if body.categoryIds is not None or body.categorySlugs is not None:
        new_cat_ids = await resolve_categories(body.categoryIds, body.categorySlugs)
        cat_ops = {
            "deleteMany": {},
            "create": [{"category": {"connect": {"id": cid}}} for cid in new_cat_ids],
        }

    img_ops = None
    if body.imageUrls is not None:
        img_ops = {
            "deleteMany": {},
            "create": [{"url": u} for u in body.imageUrls],
        }

    slug_value = body.slug

    data = {
        "name": body.name,
        "slug": slug_value,
        "description": body.description,
        "price": to_decimal_str(body.price) if body.price is not None else None,
        "currencyCode": body.currencyCode,
        "stock": body.stock,
        "minStock": body.minStock,
        "articleNumber": body.articleNumber,
        "weightGrams": body.weightGrams,
        "lengthCm": to_decimal_str(body.lengthCm) if body.lengthCm is not None else None,
        "widthCm": to_decimal_str(body.widthCm) if body.widthCm is not None else None,
        "heightCm": to_decimal_str(body.heightCm) if body.heightCm is not None else None,
        "color": body.color,
        "mainImageUrl": body.mainImageUrl,
        "categories": cat_ops,
        "images": img_ops,
    }
    data = {k: v for k, v in data.items() if v is not None}

    try:
        updated = await prisma.product.update(
            where={"id": product_id},
            data=data,
            include={"categories": {"include": {"category": True}}, "images": True},
        )
        return ProductResponse.from_prisma(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {e}")

@router.delete("/{product_id}")
async def delete_product(product_id: str):
    existing = await prisma.product.find_unique(where={"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    await prisma.product.delete(where={"id": product_id})
    return {"message": "Product deleted successfully"}

# ---------- CSV import ----------
@router.post("/import")
async def import_products(csv_file: UploadFile = File(...)):
    """
    CSV columns (new schema):
    name,slug,description,price,currencyCode,stock,categorySlugs,mainImageUrl,images
    - categorySlugs: comma-separated (e.g. "nuts,spreads")
    - images: comma-separated list of URLs (extra gallery images)
    """
    if not csv_file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await csv_file.read()
    rows = list(csv.DictReader(io.StringIO(content.decode("utf-8"))))
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    required = ["name"]
    missing = [c for c in required if c not in (rows[0].keys() if rows else [])]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing)}")

    imported, errors = 0, []
    for i, row in enumerate(rows, start=2):
        try:
            name = (row.get("name") or "").strip()
            if not name:
                errors.append(f"Row {i}: name is required")
                continue

            slug = (row.get("slug") or "").strip() or slugify(name)
            price_raw = (row.get("price") or "").strip() or None
            price = to_decimal_str(price_raw) if price_raw is not None else None
            currency = (row.get("currencyCode") or "").strip() or None
            stock = int(row.get("stock") or 0)
            main_image = (row.get("mainImageUrl") or "").strip() or None

            # categories
            cat_slugs = [s.strip() for s in (row.get("categorySlugs") or "").split(",") if s.strip()]
            cat_ids = await resolve_categories(None, cat_slugs)

            # images
            extra_images = [s.strip() for s in (row.get("images") or "").split(",") if s.strip()]

            data = {
                "name": name,
                "slug": slug,
                "description": row.get("description") or None,
                "price": price,
                "currencyCode": currency,
                "stock": stock,
                "minStock": 5,
                "mainImageUrl": main_image,
                "categories": {"create": [{"category": {"connect": {"id": cid}}} for cid in cat_ids]} if cat_ids else None,
                "images": {"create": [{"url": url} for url in extra_images]} if extra_images else None,
            }

            # remove None keys to avoid prisma errors
            data = {k: v for k, v in data.items() if v is not None}

            await prisma.product.create(
                data=data,
                include={"categories": {"include": {"category": True}}, "images": True},
            )
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {e}")

    return JSONResponse({
        "imported": imported,
        "total": len(rows),
        "errors": errors or None,
        "message": f"Imported {imported}/{len(rows)} products",
    })

@router.post("/admin/import")
async def import_products_admin(csv_file: UploadFile = File(...)):
    return await import_products(csv_file)

# ---------- Admin Endpoints for Home Page Management ----------
@router.get("/admin/home/featured", response_model=List[ProductResponse])
async def get_admin_featured_products():
    """Admin endpoint to manage featured products"""
    return await get_featured_products(limit=50)

@router.put("/admin/products/{product_id}/feature")
async def toggle_product_feature(product_id: str, featured: bool):
    """Toggle product featured status"""
    existing = await prisma.product.find_unique(where={"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await prisma.product.update(
        where={"id": product_id},
        data={"featured": featured},
        include={"categories": {"include": {"category": True}}, "images": True},
    )
    return ProductResponse.from_prisma(updated)

@router.put("/admin/products/{product_id}/top")
async def toggle_product_top(product_id: str, top_product: bool):
    """Toggle product top status"""
    existing = await prisma.product.find_unique(where={"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await prisma.product.update(
        where={"id": product_id},
        data={"isTopProduct": top_product},
        include={"categories": {"include": {"category": True}}, "images": True},
    )
    return ProductResponse.from_prisma(updated)

# Admin mirrors
@router.get("/admin/products", response_model=PaginatedProductResponse)
async def get_products_admin(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = Query(None)
):
    where = {}
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        where["OR"] = [
            {"name": {"contains": search_term, "mode": "insensitive"}},
            {"description": {"contains": search_term, "mode": "insensitive"}}
        ]
    
    total_count = await prisma.product.count(where=where)
    
    prods = await prisma.product.find_many(
        skip=skip,
        take=limit,
        where=where,
        include={"categories": {"include": {"category": True}}, "images": True},
        order={"createdAt": "desc"},
    )
    
    current_page = (skip // limit) + 1
    total_pages = (total_count + limit - 1) // limit if limit > 0 else 1
    
    return PaginatedProductResponse(
        products=[ProductResponse.from_prisma(product) for product in prods],
        total_count=total_count,
        page=current_page,
        total_pages=total_pages,
        has_next=current_page < total_pages,
        has_prev=current_page > 1
    )

@router.post("/admin/products", response_model=ProductResponse)
async def create_product_admin(body: ProductCreate):
    return await create_product(body)

@router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product_admin(product_id: str, body: ProductUpdate):
    return await update_product(product_id, body)

@router.delete("/admin/products/{product_id}")
async def delete_product_admin(product_id: str):
    return await delete_product(product_id)