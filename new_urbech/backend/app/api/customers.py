from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.auth import require_admin
from app.db.session import prisma
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()


def serialize_customer(customer) -> CustomerResponse:
    orders = getattr(customer, "orders", None) or []
    return CustomerResponse(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        group=customer.group,
        city=customer.city,
        country=customer.country,
        createdAt=customer.createdAt,
        orderCount=len(orders),
    )


@router.get("/", response_model=list[CustomerResponse])
async def list_customers(
    search: str | None = Query(None),
    _admin=Depends(require_admin),
):
    where = {}
    if search and search.strip():
        term = search.strip()
        where = {
            "OR": [
                {"name": {"contains": term, "mode": "insensitive"}},
                {"email": {"contains": term, "mode": "insensitive"}},
                {"phone": {"contains": term, "mode": "insensitive"}},
                {"city": {"contains": term, "mode": "insensitive"}},
                {"country": {"contains": term, "mode": "insensitive"}},
            ]
        }

    customers = await prisma.customer.find_many(
        where=where,
        include={"orders": True},
        order={"createdAt": "desc"},
    )
    return [serialize_customer(customer) for customer in customers]


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, _admin=Depends(require_admin)):
    customer = await prisma.customer.find_unique(
        where={"id": customer_id},
        include={"orders": True},
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return serialize_customer(customer)


@router.post("/", response_model=CustomerResponse)
async def create_customer(payload: CustomerCreate, _admin=Depends(require_admin)):
    existing = await prisma.customer.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Customer email already exists")

    customer = await prisma.customer.create(data=payload.model_dump())
    return serialize_customer(customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, payload: CustomerUpdate, _admin=Depends(require_admin)):
    customer = await prisma.customer.find_unique(
        where={"id": customer_id},
        include={"orders": True},
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    data = payload.model_dump(exclude_none=True)
    if "email" in data:
        existing = await prisma.customer.find_unique(where={"email": data["email"]})
        if existing and existing.id != customer_id:
            raise HTTPException(status_code=400, detail="Customer email already exists")

    updated = await prisma.customer.update(
        where={"id": customer_id},
        data=data,
        include={"orders": True},
    )
    return serialize_customer(updated)


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, _admin=Depends(require_admin)):
    customer = await prisma.customer.find_unique(
        where={"id": customer_id},
        include={"orders": True},
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.orders and len(customer.orders) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with existing orders",
        )

    await prisma.customer.delete(where={"id": customer_id})
    return {"message": "Customer deleted successfully"}
