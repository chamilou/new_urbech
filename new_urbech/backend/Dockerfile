FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything (includes prisma/schema.prisma)
COPY . .

# ✅ Generate prisma-client-py inside the image
# (requires `prisma` python package to be installed via requirements.txt)
RUN prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 8000

# ✅ Correct uvicorn command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

