from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from app.schemas.auth import UserLogin, UserRegister, Token
from app.utils.auth import (
    ALGORITHM, SECRET_KEY, authenticate_user, create_access_token, 
    get_password_hash, get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.db.session import prisma
from fastapi import HTTPException, status
import traceback

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await prisma.user.find_unique(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user - FIXED: Ensure all required fields are included
    hashed_password = get_password_hash(user_data.password)
    
    # Create the user data dictionary with all required fields
    user_data_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "hashedPassword": hashed_password,
        "role": "USER"  # Make sure role is included if it's required
    }
    
    user = await prisma.user.create(data=user_data_dict)
    from fastapi import HTTPException, status
    import traceback
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me")
async def read_users_me(current_user = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.post("/logout")
async def logout():
    # With JWT, logout is handled on the client side by removing the token
    return {"message": "Successfully logged out"}

@router.get("/debug-token")
async def debug_token(token: str = Depends(oauth2_scheme)):
    """Debug endpoint to check token validation"""
    from jose import jwt
    from app.utils.auth import SECRET_KEY, ALGORITHM
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "valid": True,
            "payload": payload,
            "email": payload.get("sub"),
            "secret_key_used": SECRET_KEY,
            "algorithm_used": ALGORITHM
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "secret_key_used": SECRET_KEY,
            "algorithm_used": ALGORITHM
        }