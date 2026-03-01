# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- Keep this one
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from app.db.session import prisma
# Import from config instead of defining here
from app.core.config import MEDIA_ROOT, ALLOWED_ORIGINS
from app.api.endpoints import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("Starting up...")
    await prisma.connect()
    print("Database connected!")
    
    yield  # This is where the app runs
    
    # Shutdown code
    print("Shutting down...")
    await prisma.disconnect()
    print("Database disconnected!")

# Create FastAPI app with lifespan
app = FastAPI(
    title="MyShop API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - THIS IS CRITICAL
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to MyShop API"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "API is running",
    }

# Add a CORS test endpoint
@app.get("/api/cors-test")
async def cors_test():
    return {
        "success": True,
        "message": "CORS is working!",
    }
