#app/api/users.py
from fastapi import APIRouter, HTTPException, Depends
from app.db.session import prisma
from app.schemas.user import UserCreate, UserResponse  # Importing the schemas!
from app.utils.security import hash_password
from app.api.auth import get_current_user, require_admin


router = APIRouter()

@router.post("", response_model=UserResponse)  # Using the schema as response model
async def create_user(user: UserCreate, _admin=Depends(require_admin)):  # Using the schema as request body
    # Check if user exists
    existing_user = await prisma.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user.password)
    
    # Create user in database
    db_user = await prisma.user.create(
        data={
            "email": user.email,
            "hashedPassword": hashed_password,
            "name": user.name,
        }
    )
    
    return db_user  # This gets validated against UserResponse schema

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    if current_user.role != "ADMIN" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user  # Validated against UserResponse schema
