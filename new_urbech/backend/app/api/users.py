from fastapi import APIRouter, HTTPException, Depends
from app.db.session import prisma
from app.schemas.user import UserCreate, UserResponse # Importing the schemas!
from app.utils.auth import get_password_hash

router = APIRouter()

@router.post("/", response_model=UserResponse)  # Using the schema as response model
async def create_user(user: UserCreate):  # Using the schema as request body
    # Check if user exists
    existing_user = await prisma.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user in database
    db_user = await prisma.user.create({
        "email": user.email,
        "password": hashed_password,
        "name": user.name
    })
    
    return db_user  # This gets validated against UserResponse schema

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user  # Validated against UserResponse schema