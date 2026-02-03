from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
import random
import hmac
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from app.db.session import prisma
from app.utils.security import hash_password, verify_password, create_access_token, decode_token
from app.utils.email import send_verification_email, send_password_reset_email  # must accept code=...

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --------------------
# Pydantic models (INLINE = fewer files)
# --------------------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyRequest(BaseModel):
    email: EmailStr
    code: str

class ResendRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


def gen_code() -> str:
    return f"{random.randint(100000, 999999)}"


# --------------------
# Auth helpers
# --------------------
async def get_current_user(token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    user = await prisma.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# --------------------
# Routes
# --------------------
@router.post("/register")
async def register(payload: RegisterRequest, background_tasks: BackgroundTasks):
    existing = await prisma.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Always create standard users; do not auto-assign admin on first registration.
    role = "USER"

    code = gen_code()
    user = await prisma.user.create(data={
        "name": payload.name,
        "email": payload.email,
        "hashedPassword": hash_password(payload.password),
        "role": role,
        "isVerified": False,
        "verificationCode": code,
    })

    # send code (do not crash registration if email fails)
    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        name=user.name,
        code=code,
    )

    return {
        "message": "Registered. Check your email for the verification code.",
        "requiresVerification": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "isVerified": user.isVerified
        }
    }


@router.post("/verify-email")
async def verify_email(payload: VerifyRequest):
    user = await prisma.user.find_unique(where={"email": payload.email})
    if not user:
        # security: don't leak existence too much (still okay to say invalid)
        raise HTTPException(status_code=400, detail="Invalid code or email")

    if user.isVerified:
        # Do not issue tokens here; force login instead.
        return {"message": "Already verified. Please log in."}

    if not user.verificationCode:
        raise HTTPException(status_code=400, detail="Invalid code or email")

    # constant-time compare
    if not hmac.compare_digest(user.verificationCode, payload.code):
        raise HTTPException(status_code=400, detail="Invalid code or email")

    updated = await prisma.user.update(
        where={"id": user.id},
        data={"isVerified": True, "verificationCode": None},
    )

    token = create_access_token(updated.email)
    return {
        "message": "Email verified",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": updated.id,
            "name": updated.name,
            "email": updated.email,
            "role": updated.role,
            "isVerified": updated.isVerified
        }
    }


@router.post("/resend-verification")
async def resend_verification(payload: ResendRequest, background_tasks: BackgroundTasks):
    user = await prisma.user.find_unique(where={"email": payload.email})

    # security: do not reveal if user exists
    if not user:
        return {"message": "If an account exists, a code has been sent."}

    if user.isVerified:
        return {"message": "Already verified"}

    code = gen_code()
    await prisma.user.update(where={"id": user.id}, data={"verificationCode": code})

    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        name=user.name,
        code=code,
    )

    return {"message": "If an account exists, a code has been sent."}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Send password reset email if account exists. Always returns generic message."""
    user = await prisma.user.find_unique(where={"email": payload.email})

    # Always respond generically to avoid user enumeration
    if not user:
        return {"message": "If an account exists, a reset link has been sent."}

    # Remove existing tokens for this user to avoid clutter/reuse
    await prisma.passwordresettoken.delete_many(where={"userId": user.id})

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    await prisma.passwordresettoken.create(
        data={
            "token": token_hash,
            "expiresAt": expires_at,
            "userId": user.id,
        }
    )

    reset_base = os.getenv("FRONTEND_RESET_URL", "http://localhost:3000/reset-password")
    separator = "&" if "?" in reset_base else "?"
    reset_link = f"{reset_base}{separator}token={raw_token}"

    background_tasks.add_task(
        send_password_reset_email,
        email=user.email,
        name=user.name,
        reset_link=reset_link,
        expires_minutes=30,
    )

    return {"message": "If an account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    record = await prisma.passwordresettoken.find_unique(where={"token": token_hash})

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    if record.expiresAt < datetime.now(timezone.utc):
        await prisma.passwordresettoken.delete(where={"id": record.id})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = await prisma.user.find_unique(where={"id": record.userId})
    if not user:
        await prisma.passwordresettoken.delete(where={"id": record.id})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    new_hash = hash_password(payload.password)

    await prisma.user.update(
        where={"id": user.id},
        data={
            "hashedPassword": new_hash,
            "passwordChangedAt": datetime.now(timezone.utc),
        },
    )

    # Invalidate all tokens for this user after a successful reset
    await prisma.passwordresettoken.delete_many(where={"userId": user.id})

    return {"message": "Password updated successfully"}


@router.post("/login")
async def login(payload: LoginRequest):
    user = await prisma.user.find_unique(where={"email": payload.email})
    if not user or not verify_password(payload.password, user.hashedPassword):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.isVerified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified",
            headers={"X-Verification-Required": "true"},
        )

    token = create_access_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "isVerified": user.isVerified},
    }


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "role": current_user.role, "isVerified": current_user.isVerified}


@router.post("/logout")
async def logout():
    return {"message": "Logged out (client removes token)"}
