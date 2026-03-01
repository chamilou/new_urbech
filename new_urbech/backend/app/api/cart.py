from fastapi import APIRouter, HTTPException, Depends
from app.db.session import prisma
from app.schemas.product import Product
from app.schemas.cart import CartItem, CartItemCreate  # We'll need to create this schema
from typing import List
from app.api.auth import get_current_user

router = APIRouter()

# First, let's create the cart schema (app/schemas/cart.py)
# We need to add this since we're referencing it

@router.get("", response_model=List[CartItem])
async def get_cart_items(current_user=Depends(get_current_user)):
    user_id = current_user.id

    cart_items = await prisma.cartitem.find_many(
        where={"userId": user_id},
        include={"product": True}
    )
    return cart_items

@router.post("", response_model=CartItem)
async def add_to_cart(cart_item: CartItemCreate, current_user=Depends(get_current_user)):
    user_id = current_user.id

    # Check if product exists
    product = await prisma.product.find_unique(where={"id": cart_item.productId})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is in stock
    if product.stock < cart_item.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough stock. Available: {product.stock}, Requested: {cart_item.quantity}"
        )
    
    # Check if item already in cart
    existing_item = await prisma.cartitem.find_first(
        where={
            "userId": user_id,
            "productId": cart_item.productId
        }
    )
    
    if existing_item:
        # Update quantity if item already exists
        updated_item = await prisma.cartitem.update(
            where={"id": existing_item.id},
            data={"quantity": existing_item.quantity + cart_item.quantity}
        )
        # Return the updated item with product details
        return await prisma.cartitem.find_unique(
            where={"id": updated_item.id},
            include={"product": True}
        )
    else:
        # Add new item to cart
        new_item = await prisma.cartitem.create(
            data={
                "userId": user_id,
                "productId": cart_item.productId,
                "quantity": cart_item.quantity,
            }
        )
        # Return the new item with product details
        return await prisma.cartitem.find_unique(
            where={"id": new_item.id},
            include={"product": True}
        )

@router.put("/{item_id}", response_model=CartItem)
async def update_cart_item(item_id: str, quantity: int, current_user=Depends(get_current_user)):
    # Check if cart item exists
    cart_item = await prisma.cartitem.find_unique(where={"id": item_id})
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    # Check if user owns this cart item
    user_id = current_user.id
    if cart_item.userId != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this cart item")
    
    # Check product stock if increasing quantity
    if quantity > cart_item.quantity:
        product = await prisma.product.find_unique(where={"id": cart_item.productId})
        additional_quantity = quantity - cart_item.quantity
        if product.stock < additional_quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock. Available: {product.stock}, Requested additional: {additional_quantity}"
            )
    
    # Update quantity
    updated_item = await prisma.cartitem.update(
        where={"id": item_id},
        data={"quantity": quantity}
    )
    
    # Return the updated item with product details
    return await prisma.cartitem.find_unique(
        where={"id": updated_item.id},
        include={"product": True}
    )

@router.delete("/{item_id}")
async def remove_from_cart(item_id: str, current_user=Depends(get_current_user)):
    # Check if cart item exists
    cart_item = await prisma.cartitem.find_unique(where={"id": item_id})
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    # Check if user owns this cart item
    user_id = current_user.id
    if cart_item.userId != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this cart item")
    
    # Remove the item
    await prisma.cartitem.delete(where={"id": item_id})
    
    return {"message": "Item removed from cart successfully"}

@router.delete("")
async def clear_cart(current_user=Depends(get_current_user)):
    user_id = current_user.id

    # Remove all cart items for user
    await prisma.cartitem.delete_many(where={"userId": user_id})
    
    return {"message": "Cart cleared successfully"}

@router.get("/count")
async def get_cart_item_count(current_user=Depends(get_current_user)):
    user_id = current_user.id

    count = await prisma.cartitem.count(where={"userId": user_id})
    return {"count": count}
