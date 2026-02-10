from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from pydantic import EmailStr

# --- Головна таблиця USER ---
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True)
    hashed_password: str
    disabled: bool = Field(default=False)

    # === СТРІЛКИ (ЗВ'ЯЗКИ) ===
    # Один User має багато Transactions, Goals, WishlistItems
    transactions: List["Transaction"] = Relationship(back_populates="user")
    goals: List["Goal"] = Relationship(back_populates="owner")
    wishlist_items: List["WishlistItem"] = Relationship(back_populates="owner")


# --- Таблиця TRANSACTION ---
class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float
    category: str
    description: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Зовнішній ключ
    user_id: int = Field(foreign_key="users.id")
    # Зворотній зв'язок
    user: Optional[User] = Relationship(back_populates="transactions")


# --- Таблиця GOAL ---
class Goal(SQLModel, table=True):
    __tablename__ = "goals"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    target_amount: float
    monthly_contribution: float
    current_savings: float = Field(default=0.0)

    # Зовнішній ключ
    owner_id: int = Field(foreign_key="users.id")
    # Зворотній зв'язок
    owner: Optional[User] = Relationship(back_populates="goals")


# --- Таблиця WISHLIST ---
class WishlistItem(SQLModel, table=True):
    __tablename__ = "wishlist"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price: float
    priority: int = Field(default=1)
    is_bought: bool = Field(default=False)

    # Зовнішній ключ
    owner_id: int = Field(foreign_key="users.id")
    # Зворотній зв'язок
    owner: Optional[User] = Relationship(back_populates="wishlist_items")
