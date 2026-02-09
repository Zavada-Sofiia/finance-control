from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, create_engine, Session, select
from pydantic import EmailStr

sqlite_url = "sqlite:///finance_database.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

# --- Моделі Бази Даних ---
class User(SQLModel, table=True):
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    disabled: bool = Field(default=False)

# --- Моделі для API (Pydantic) ---
class UserRead(SQLModel):
    username: str
    email: str

# Ініціалізація БД
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Генератор сесій
def get_session():
    with Session(engine) as session:
        yield session
