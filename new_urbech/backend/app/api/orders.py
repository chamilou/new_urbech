from fastapi import APIRouter, HTTPException, Depends
from app.db.session import prisma
from app.schemas.order import Order, OrderCreate, OrderItemCreate
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Order])
async def get_orders(skip: int = 0, limit: int = 100):
    orders = await prisma.order.find_many(
        skip=skip,
        take=limit,
        include={
            "items": {
                "include": {
                    "product": True
                }
            }
        },
        order={"created_at": "desc"}
    )
    return orders

@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: int):
    order = await prisma.order.find_unique(
        where={"id": order_id},
        include={
            "items": {
                "include": {
                    "product": True
                }
            }
        }
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=Order)
async def create_order(order_data: OrderCreate):
    # For now, we'll use a hardcoded user ID
    # In a real app, you'd get this from the authenticated user
    user_id = 1
    
    # Calculate total price
    total = 0
    for item in order_data.items:
        # Get product price from database
        product = await prisma.product.find_unique(where={"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        
        # Check stock availability
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for product {product.name}. Available: {product.stock}, Requested: {item.quantity}"
            )
        
        total += product.price * item.quantity
    
    # Create the order
    db_order = await prisma.order.create({
        "userId": user_id,
        "total": total,
        "status": order_data.status
    })
    
    # Create order items and update product stock
    for item in order_data.items:
        product = await prisma.product.find_unique(where={"id": item.product_id})
        
        await prisma.orderitem.create({
            "orderId": db_order.id,
            "productId": item.product_id,
            "quantity": item.quantity,
            "price": product.price
        })
        
        # Update product stock
        await prisma.product.update(
            where={"id": item.product_id},
            data={"stock": product.stock - item.quantity}
        )
    
    # Return the complete order with items
    return await prisma.order.find_unique(
        where={"id": db_order.id},
        include={
            "items": {
                "include": {
                    "product": True
                }
            }
        }
    )

@router.put("/{order_id}/status")
async def update_order_status(order_id: int, status: str):
    # Check if order exists
    existing_order = await prisma.order.find_unique(where={"id": order_id})
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    updated_order = await prisma.order.update(
        where={"id": order_id},
        data={"status": status, "updated_at": datetime.utcnow()}
    )
    
    return {"message": f"Order status updated to {status}", "order": updated_order}

@router.get("/user/{user_id}", response_model=List[Order])
async def get_user_orders(user_id: int, skip: int = 0, limit: int = 100):
    orders = await prisma.order.find_many(
        where={"userId": user_id},
        skip=skip,
        take=limit,
        include={
            "items": {
                "include": {
                    "product": True
                }
            }
        },
        order={"created_at": "desc"}
    )
    return orders