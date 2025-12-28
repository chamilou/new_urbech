from prisma import Prisma
import os
from dotenv import load_dotenv
from prisma.engine import QueryEngine

load_dotenv()

prisma = Prisma()
async def connect_db():
    await prisma.connect()

async def disconnect_db():
    await prisma.disconnect()