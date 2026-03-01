from fastapi import APIRouter
from app.db.session import prisma

router = APIRouter()

@router.get("")
async def get_stats():
    """Get dashboard statistics"""
    try:
        # Get total products count
        total_products = await prisma.product.count()
        
        # Get total orders count
        total_orders = await prisma.order.count()
        
        # Get total customers count
        total_customers = await prisma.customer.count()
        
        # Get low stock products count
        low_stock_products = await prisma.product.count(
            where={
                "OR": [
                    {"stock": {"lte": 5}},  # Stock less than or equal to 5
                    {"isLowStock": True}
                ]
            }
        )
        
        # Get recent orders (last 7 days)
        # You'll need to import datetime for this
        from datetime import datetime, timedelta
        last_week = datetime.now() - timedelta(days=7)
        
        recent_orders = await prisma.order.count(
            where={
                "createdAt": {"gte": last_week}
            }
        )
        
        return {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "low_stock_products": low_stock_products,
            "recent_orders": recent_orders
        }
        
    except Exception as e:
        return {"error": str(e)}
