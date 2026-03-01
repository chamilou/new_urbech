# app/routes/categories.py
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, field_validator
from typing import Optional, List
from slugify import slugify

from app.db.session import prisma  # Prisma() singleton
from app.api.auth import require_admin

router = APIRouter()


# --------- Pydantic DTOs ---------
class CategoryCreate(BaseModel):
    name: str
    parentId: Optional[str] = None
    slug: Optional[str] = None  # optional override
    defaultSortOrder: Optional[int] = 0  # Sorting Order in Menu Bar

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, v: Optional[str], info):
        if v is None:
            return v
        s = slugify(v)
        if not s:
            raise ValueError("Invalid slug")
        return s


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parentId: Optional[str] = None
    slug: Optional[str] = None
    defaultSortOrder: Optional[int] = None  # Make optional for updates

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, v: Optional[str], info):
        if v is None:
            return v
        s = slugify(v)
        if not s:
            raise ValueError("Invalid slug")
        return s


# --------- Helpers ---------
async def compute_path(slug: str, parent_id: Optional[str]) -> str:
    """Build materialized path from parent chain."""
    if not parent_id:
        return slug
    parent = await prisma.category.find_unique(where={"id": parent_id})
    if not parent:
        raise HTTPException(status_code=400, detail="parentId does not exist")
    parent_path = parent.path or parent.slug
    return f"{parent_path}/{slug}" if parent_path else slug


async def update_subtree_paths(root_id: str):
    """Recompute `path` for all descendants when a node's slug/parent changes."""
    root = await prisma.category.find_unique(where={"id": root_id})
    if not root:
        return

    # BFS to update children
    queue: List[tuple[str, str]] = [(root.id, root.path or root.slug)]
    while queue:
        node_id, node_path = queue.pop(0)
        children = await prisma.category.find_many(where={"parentId": node_id})
        for ch in children:
            new_path = f"{node_path}/{ch.slug}" if node_path else ch.slug
            if ch.path != new_path:
                await prisma.category.update(
                    where={"id": ch.id},
                    data={"path": new_path},
                )
            queue.append((ch.id, new_path))


# --------- Endpoints ---------

@router.get("")
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    includeProducts: bool = Query(False, alias="includeProducts"),
    includeParent: bool = Query(True, alias="includeParent"),
    includeChildren: bool = Query(False, alias="includeChildren"),
    sortBy: str = Query("defaultSortOrder", description="Sort by field: defaultSortOrder, name, productCount")
):
    """Get categories with optional product inclusion"""
    try:
        # Build include query - keep it simple for now
        include = {}
        if includeParent:
            include["parent"] = True
            
        if includeProducts:
            include["products"] = {
                "include": {
                    "product": {
                        "include": {
                            "images": {
                                "order_by": [{"isPrimary": "desc"}, {"sortOrder": "asc"}],
                                "take": 1,
                            }
                        }
                    }
                },
                "order_by": [{"sortOrder": "asc"}],
            }

        # Determine sort order
        sort_config = {}
        if sortBy == "defaultSortOrder":
            sort_config = {"defaultSortOrder": "desc"}
        elif sortBy == "name":
            sort_config = {"name": "asc"}
        elif sortBy == "productCount":
            sort_config = {"name": "asc"}
        else:
            sort_config = {"defaultSortOrder": "desc"}

        # Fetch categories
        categories = await prisma.category.find_many(
            skip=skip,
            take=limit,
            include=include,
            order=sort_config
        )

        # Transform the data for frontend - SIMPLIFIED VERSION
        result = []
        for category in categories:
            category_data = {
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "path": category.path,
                "defaultSortOrder": category.defaultSortOrder,
                "parentId": category.parentId,  # CRITICAL: Include parentId for frontend filtering
                "parent": {
                    "id": category.parent.id,
                    "name": category.parent.name
                } if category.parent else None,
            }

            # Handle products if included
            if includeProducts:
                products = []
                product_count = 0
                
                if hasattr(category, 'products'):
                    product_count = len(category.products)
                    for product_category in category.products:
                        product = product_category.product
                        if product:
                            main_image_url = product.mainImageUrl
                            if hasattr(product, 'images') and product.images:
                                main_image_url = product.images[0].url if product.images else product.mainImageUrl
                            
                            products.append({
                                "id": product.id,
                                "name": product.name,
                                "slug": product.slug,
                                "description": product.description,
                                "price": float(product.price) if product.price else None,
                                "currencyCode": product.currencyCode,
                                "stock": product.stock,
                                "status": product.status,
                                "isLowStock": product.isLowStock,
                                "mainImageUrl": main_image_url,
                                "sortOrder": product_category.sortOrder,
                            })
                
                category_data["products"] = products
                category_data["productCount"] = product_count
            else:
                # If not including products, we still need productCount
                product_count = await prisma.productcategory.count(
                    where={"categoryId": category.id}
                )
                category_data["productCount"] = product_count
                category_data["products"] = []

            result.append(category_data)

        if sortBy == "productCount":
            result.sort(key=lambda x: x["productCount"], reverse=True)

        return result

    except Exception as e:
        print(f"Error in get_categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.post("")
async def create_category(body: CategoryCreate, _admin=Depends(require_admin)):
    """Create a new category, auto-slugify, compute path, validate parent."""
    
    try:
        # slug: prefer provided, else from name
        slug = body.slug or slugify(body.name)
        if not slug:
            raise HTTPException(status_code=400, detail="Cannot create empty slug from name")

        # unique slug check (slug is unique in the schema)
        existing = await prisma.category.find_unique(where={"slug": slug})
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")

        # validate parent & compute path
        path = await compute_path(slug, body.parentId)

        created = await prisma.category.create(
            data={
                "name": body.name,
                "slug": slug,
                "parentId": body.parentId,
                "path": path,
                "defaultSortOrder": body.defaultSortOrder or 0,  # Add this
            }
        )
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating category: {e}")


@router.put("/{category_id}")
async def update_category(category_id: str, body: CategoryUpdate, _admin=Depends(require_admin)):
    """Update name/slug/parent. Recomputes path and descendants' paths."""
    try:
        current = await prisma.category.find_unique(where={"id": category_id})
        if not current:
            raise HTTPException(status_code=404, detail="Category not found")

        # Determine next values
        next_name = body.name if body.name is not None else current.name
        next_slug = body.slug or (current.slug if body.name is None else slugify(next_name))
        if not next_slug:
            raise HTTPException(status_code=400, detail="Invalid slug")

        # If slug changed, check uniqueness
        if next_slug != current.slug:
            conflict = await prisma.category.find_unique(where={"slug": next_slug})
            if conflict and conflict.id != category_id:
                raise HTTPException(status_code=400, detail="Slug already exists")

        # If parent changed, validate not making a cycle and parent exists
        next_parent_id = body.parentId if body.parentId is not None else current.parentId
        if next_parent_id == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")

        if next_parent_id:
            parent = await prisma.category.find_unique(where={"id": next_parent_id})
            if not parent:
                raise HTTPException(status_code=400, detail="parentId does not exist")

            # cycle check: parent cannot be a descendant of this category
            # quick upward traversal
            walker = parent
            while walker and walker.parentId:
                if walker.parentId == category_id:
                    raise HTTPException(status_code=400, detail="Cycle detected in category tree")
                walker = await prisma.category.find_unique(where={"id": walker.parentId})

        # compute new path
        next_path = await compute_path(next_slug, next_parent_id)

        # Prepare update data
        update_data = {
            "name": next_name,
            "slug": next_slug,
            "parentId": next_parent_id,
            "path": next_path,
        }
        
        # Include defaultSortOrder if provided
        if body.defaultSortOrder is not None:
            update_data["defaultSortOrder"] = body.defaultSortOrder

        # apply update
        updated = await prisma.category.update(
            where={"id": category_id},
            data=update_data,
        )

        # re-path descendants if slug/parent changed
        if next_slug != current.slug or next_parent_id != current.parentId:
            await update_subtree_paths(category_id)

        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating category: {e}")


@router.delete("/{category_id}")
async def delete_category(category_id: str, _admin=Depends(require_admin)):
    """Delete a category only if it has no children and no products."""
    try:
        category = await prisma.category.find_unique(
            where={"id": category_id},
            include={
                # children
                "children": True,
                # products is the join table ProductCategory[]
                "products": True,
            },
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # block if children exist
        if category.children and len(category.children) > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete category with subcategories. Remove/move them first.",
            )

        # block if products are linked
        if category.products and len(category.products) > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete category with products. Move or detach products first.",
            )

        await prisma.category.delete(where={"id": category_id})
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting category: {e}")
