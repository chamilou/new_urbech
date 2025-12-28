from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.db.session import prisma
import logging

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def authenticate_user(email: str, password: str):
    """Authenticate a user with email and password"""
    user = await prisma.user.find_unique(where={"email": email})
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    print(f"🔐 get_current_user called with token: {token}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        print("❌ No token provided")
        raise credentials_exception
        
    try:
        print(f"🔐 Attempting to decode token with SECRET_KEY: {SECRET_KEY}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"🔐 Token decoded successfully: {payload}")
        
        email: str = payload.get("sub")
        if email is None:
            print("❌ No 'sub' claim in token")
            raise credentials_exception
            
        print(f"🔐 Looking up user with email: {email}")
        user = await prisma.user.find_unique(where={"email": email})
        
        if user is None:
            print(f"❌ User not found for email: {email}")
            raise credentials_exception
            
        print(f"✅ User authenticated: {user.name} ({user.email})")
        return user
        
    except JWTError as e:
        print(f"❌ JWT decode error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"❌ Unexpected error in get_current_user: {e}")
        raise credentials_exception

async def get_current_active_user(current_user = Depends(get_current_user)):
    return current_user