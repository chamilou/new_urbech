# app/core/config.py
# app/core/config.py
import os
from pathlib import Path
from urllib.parse import urlparse
from app.core.env import load_project_env

load_project_env()

# Base directory of the project
BASE_DIR = Path(__file__).parent.parent

# Media directories
MEDIA_ROOT = BASE_DIR / "media"
PRODUCT_DIR = MEDIA_ROOT / "products"
USER_DIR = MEDIA_ROOT / "users"
BLOG_DIR = MEDIA_ROOT / "blog"
BLOG_DATA_FILE = BLOG_DIR / "articles.json"

# Create directories if they don't exist
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
USER_DIR.mkdir(parents=True, exist_ok=True)
BLOG_DIR.mkdir(parents=True, exist_ok=True)

# CORS settings - FIXED (remove the incorrect 'and')
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000"
).split(",")

# Clean up any whitespace
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "").strip()
if allowed_hosts_env:
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_env.split(",") if host.strip()]
else:
    derived_hosts = {"localhost", "127.0.0.1"}
    for origin in ALLOWED_ORIGINS:
        parsed = urlparse(origin)
        if parsed.hostname:
            derived_hosts.add(parsed.hostname)
    ALLOWED_HOSTS = sorted(derived_hosts)

# Add more configuration as needed
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set")
