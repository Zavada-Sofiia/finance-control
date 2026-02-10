from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional

import jwt
from fastapi import FastAPI, HTTPException, status, Depends, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, Field, EmailStr
from sqlmodel import Session, select

from db.database import (User, Transaction, UserRead, TransactionCreate, create_db_and_tables, get_session)

# Налаштування безпеки
with open('core/secret_key', 'r', encoding='utf-8') as file:
    SECRET_KEY = file.read()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Finance Tracker API")

# Створюємо таблиці при запуску
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Dependency для отримання сесії БД
SessionDep = Annotated[Session, Depends(get_session)]

# --- Pydantic моделі для API ---
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8)
    email: EmailStr | None = None

# --- Функції безпеки ---
def get_password_hash(password: str):
    return password_hash.hash(password)

def verify_password(plain, hashed):
    return password_hash.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: SessionDep) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except InvalidTokenError: raise credentials_exception

    user = session.exec(select(User).where(User.username == username)).first()
    if not user: raise credentials_exception
    return user

# --- Ендпоінти користувачів ---

@app.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: SessionDep):
    existing = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Створюємо об'єкт User для бази, хешуючи пароль з UserCreate
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# --- Ендпоінти транзакцій ---

@app.post("/transactions/", response_model=Transaction)
def create_transaction(
    data: TransactionCreate,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    db_tx = Transaction(**data.model_dump(), user_id=user.id)
    session.add(db_tx)
    session.commit()
    session.refresh(db_tx)
    return db_tx

@app.get("/transactions/", response_model=List[Transaction])
def get_transactions(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
    offset: int = 0,
    limit: int = Query(default=10, le=100),
    category: Optional[str] = None
):
    query = select(Transaction).where(Transaction.user_id == user.id)
    if category:
        query = query.where(Transaction.category == category)
    return session.exec(query.offset(offset).limit(limit)).all()

@app.delete("/transactions/{tx_id}")
def delete_transaction(
    tx_id: int,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    tx = session.get(Transaction, tx_id)
    if not tx or tx.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    session.delete(tx)
    session.commit()
    return {"ok": True}

@app.get("/balance")
def get_balance(session: SessionDep, user: Annotated[User, Depends(get_current_user)]):
    # Більш ефективний спосіб підрахунку балансу через SQL
    transactions = session.exec(select(Transaction).where(Transaction.user_id == user.id)).all()
    total = sum(t.amount for t in transactions)
    return {"balance": total, "count": len(transactions)}
