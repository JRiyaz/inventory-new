from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

from .config import settings

# Create highly optimized asynchronous SQLite engine with session pooling
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True, connect_args={"check_same_thread": False})

# Configure async session factory
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
)


async def seed_data(session: AsyncSession) -> None:
    from app.user.dummydata import PERMISSIONS_DATA, USERS_SEED_DATA

    from .models.domain import User, UserPermission, UserSettings
    from .utils.security import hash_password

    # 1. Seed Access Control CRUD Permissions
    for perm_dict in PERMISSIONS_DATA:
        res = await session.execute(select(UserPermission).where(UserPermission.role == perm_dict["role"]))
        if not res.scalar_one_or_none():
            session.add(UserPermission(**perm_dict))

    # 2. Seed User Profiles & Settings
    for seed_item in USERS_SEED_DATA:
        user_dict = seed_item["user"]
        settings_dict = seed_item["settings"]

        user_res = await session.execute(select(User).where(User.username == user_dict["username"]))
        if not user_res.scalar_one_or_none():
            pwd_hash = hash_password(user_dict["password_plain"])
            user_kwargs = {k: v for k, v in user_dict.items() if k != "password_plain"}

            new_user = User(**user_kwargs, password_hash=pwd_hash)
            session.add(new_user)
            await session.flush()

            new_settings = UserSettings(**settings_dict, user_id=new_user.id)
            session.add(new_settings)

    # 4. Seed Suppliers
    from app.inventory.models.domain import Product, StockLevel, StockMovement, Supplier, Warehouse
    from app.store.models.domain import Customer, Offer, SalesOrder, SalesOrderItem, SalesPayment
    from app.user.dummydata import (
        CUSTOMERS_DATA,
        OFFERS_DATA,
        ORDERS_DATA,
        PRODUCTS_DATA,
        SUPPLIERS_DATA,
        WAREHOUSES_DATA,
    )

    supplier_res = await session.execute(select(Supplier))
    if not supplier_res.scalars().first():
        for item in SUPPLIERS_DATA:
            session.add(Supplier(**item))
        await session.flush()

    # 5. Seed Products
    product_res = await session.execute(select(Product))
    if not product_res.scalars().first():
        sup_res = await session.execute(select(Supplier))
        sups = sup_res.scalars().all()
        sup_map = {s.code: s.id for s in sups}

        for i, item in enumerate(PRODUCTS_DATA):
            if i < 3:
                supplier_id = sup_map.get("SUP-001")
            elif i < 5:
                supplier_id = sup_map.get("SUP-002")
            else:
                supplier_id = sup_map.get("SUP-003")
            session.add(Product(**item, supplier_id=supplier_id))
        await session.flush()

    # 6. Seed Warehouses
    warehouse_res = await session.execute(select(Warehouse))
    if not warehouse_res.scalars().first():
        for item in WAREHOUSES_DATA:
            session.add(Warehouse(**item))
        await session.flush()

    # 7. Seed StockLevels and Movements
    stock_check = await session.execute(select(StockLevel))
    if not stock_check.scalars().first():
        p_res = await session.execute(select(Product))
        prods = p_res.scalars().all()
        w_res = await session.execute(select(Warehouse))
        whs = w_res.scalars().all()

        if prods and whs:
            import random

            for p in prods:
                for w in whs:
                    qty = random.randint(10, 150)
                    session.add(StockLevel(product_id=p.id, warehouse_id=w.id, quantity=qty, min_stock=20))
                    session.add(
                        StockMovement(
                            product_id=p.id,
                            warehouse_id=w.id,
                            quantity_changed=qty,
                            type="INBOUND",
                            reference="INITIAL-SEED",
                            details="Initial stock seed from database setup",
                            username="admin",
                        )
                    )
            await session.flush()

    # 8. Seed Customers (at least 15 to test pagination)
    customer_res = await session.execute(select(Customer))
    if not customer_res.scalars().first():
        for item in CUSTOMERS_DATA:
            session.add(Customer(**item))
        await session.flush()

    # 9. Seed Sales Orders & Payments
    order_res = await session.execute(select(SalesOrder))
    if not order_res.scalars().first():
        c_res = await session.execute(select(Customer))
        custs = c_res.scalars().all()
        p_res = await session.execute(select(Product))
        prods = p_res.scalars().all()

        prod_map = {p.sku: p.id for p in prods}
        prod_sku_name = {p.sku: p.name for p in prods}

        if custs and prods:
            for i, order_dict in enumerate(ORDERS_DATA):
                customer_id = custs[i % len(custs)].id

                so = SalesOrder(
                    order_number=order_dict["order_number"],
                    customer_id=customer_id,
                    status=order_dict["status"],
                    total_amount=order_dict["total_amount"],
                    payment_status=order_dict["payment_status"],
                )
                session.add(so)
                await session.flush()

                for item_dict in order_dict["items"]:
                    sku = item_dict["product_sku"]
                    session.add(
                        SalesOrderItem(
                            order_id=so.id,
                            product_id=prod_map.get(sku, prods[0].id),
                            sku=sku,
                            name=prod_sku_name.get(sku, prods[0].name),
                            quantity=item_dict["quantity"],
                            unit_price=item_dict["unit_price"],
                        )
                    )

                if order_dict["payment"]:
                    pay_dict = order_dict["payment"]
                    session.add(
                        SalesPayment(
                            order_id=so.id,
                            amount=pay_dict["amount"],
                            payment_method=pay_dict["payment_method"],
                            transaction_reference=pay_dict["transaction_reference"],
                            status=pay_dict["status"],
                        )
                    )
            await session.flush()

    # 10. Seed Offers
    offer_res = await session.execute(select(Offer))
    if not offer_res.scalars().first():
        p_res = await session.execute(select(Product))
        prods = p_res.scalars().all()
        prod_map = {p.category: p.id for p in prods}

        for item in OFFERS_DATA:
            product_id = prod_map.get(item["category"]) if item["category"] else None
            session.add(
                Offer(
                    title=item["title"],
                    description=item["description"],
                    discount=item["discount"],
                    category=item["category"],
                    product_id=product_id,
                    expiry_date=item["expiry_date"],
                    color=item["color"],
                )
            )
        await session.flush()

    await session.commit()


async def init_db() -> None:
    """
    Asynchronously initializes database schemas.
    Configurable to either overwrite (drop and recreate), create if not exists, or skip.
    """
    if settings.DB_OVERWRITE_TABLES:
        async with engine.begin() as conn:
            # Drop all existing tables and rebuild schema fresh
            await conn.run_sync(SQLModel.metadata.drop_all)
            await conn.run_sync(SQLModel.metadata.create_all)
    elif settings.DB_CREATE_TABLES:
        async with engine.begin() as conn:
            # Safely create tables if they do not exist
            await conn.run_sync(SQLModel.metadata.create_all)

    # Proactively seed default system data
    async with async_session_maker() as session:
        await seed_data(session)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
