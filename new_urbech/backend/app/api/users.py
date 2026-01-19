#app/api/users.py
from fastapi import APIRouter, HTTPException
from app.db.session import prisma
from app.schemas.user import UserCreate, UserResponse  # Importing the schemas!
from app.utils.security import hash_password


router = APIRouter()

@router.post("/", response_model=UserResponse)  # Using the schema as response model
async def create_user(user: UserCreate):  # Using the schema as request body
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
async def get_user(user_id: str):
    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user  # Validated against UserResponse schema
