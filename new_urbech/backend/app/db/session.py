from prisma import Prisma
from app.core.env import load_project_env

load_project_env()

prisma = Prisma()
async def connect_db():
    await prisma.connect()

async def disconnect_db():
    await prisma.disconnect()
