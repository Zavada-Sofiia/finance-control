from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, create_engine, Session, select
from pydantic import EmailStr

sqlite_url = "sqlite:///finance_database.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

# --- Моделі Бази Даних ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[EmailStr] = None
    hashed_password: str
    disabled: bool = Field(default=False)

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float  # Додатні — дохід, від'ємні — витрати
    category: str
    description: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: int = Field(foreign_key="user.id")

# --- Моделі для API (Pydantic) ---
class UserRead(SQLModel):
    id: int
    username: str
    email: Optional[EmailStr]

class TransactionCreate(SQLModel):
    amount: float
    category: str
    description: Optional[str] = None

# Ініціалізація БД
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Генератор сесій
def get_session():
    with Session(engine) as session:
        yield session
