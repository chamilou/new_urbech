# app/api/endpoints.py
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.products import router as products_router
from app.api.orders import router as orders_router
from app.api.cart import router as cart_router
from app.api.categories import router as categories_router
from app.api.stats import router as stats_router
from app.api.uploads import router as uploads_router
from app.api.settings import router as settings_router
from app.api.customers import router as customers_router
from app.api.blog import router as blog_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(cart_router, prefix="/cart", tags=["cart"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(stats_router, prefix="/stats", tags=["stats"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
api_router.include_router(customers_router, prefix="/customers", tags=["customers"])
api_router.include_router(blog_router, prefix="/blog", tags=["blog"])
