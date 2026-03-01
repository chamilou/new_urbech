import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
from fastapi import HTTPException, status

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
    raise RuntimeError("SECRET_KEY must be set to a strong, unpredictable value")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def hash_password(password: str) -> str:
    pw = password.encode("utf-8")
    if len(pw) > 72:
        pw = pw[:72]  # bcrypt limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw, salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    try:
        pw = password.encode("utf-8")
        if len(pw) > 72:
            pw = pw[:72]  # bcrypt limit
        return bcrypt.checkpw(pw, hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(email: str) -> str:
    issued_at = datetime.now(timezone.utc)
    expire = issued_at + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "iat": int(issued_at.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
