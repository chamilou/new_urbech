from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.db.session import prisma
from app.core.config import ALLOWED_HOSTS, ALLOWED_ORIGINS, ENVIRONMENT, MEDIA_ROOT
from app.api.endpoints import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()

app = FastAPI(
    title="MyShop API", 
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS or ["localhost", "127.0.0.1"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "img-src 'self' data: blob: https:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline'; "
        "font-src 'self' data: https:; "
        "connect-src 'self' https: wss:; "
        "object-src 'none'"
    )
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
