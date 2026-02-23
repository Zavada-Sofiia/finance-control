"""
Finance Control App — FastAPI + React
"""
from services.currency_service import currency_service

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, List, Optional

import jwt
from fastapi import FastAPI, HTTPException, status, Depends, Query, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlmodel import Session, select

from db.database import create_db_and_tables, get_session
from db.models import User, Transaction
from db.models import WishlistItem
from schemas.schemas import WishlistCreate, WishlistRead
from schemas.schemas import UserCreate, UserRead, Token, TransactionCreate, TransactionRead

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ініціалізація життєвого циклу застосунку.
    При запуску створює базу даних та всі таблиці,
    визначені у моделях SQLModel.

    Application lifespan handler.
    Creates the database and all SQLModel tables
    when the application starts.
    """
    create_db_and_tables()
    await currency_service.fetch_rates()
    currency_service.start()
    yield
    currency_service.stop()

# ---------- CONFIG ----------
SECRET_KEY = (Path(__file__).resolve().parent / "core" / "secret_key").read_text().strip()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI(title="Finance Tracker API", lifespan=lifespan)

# ---------- STATIC FILES ----------
# Папка dist — збірка React/Vite
app.mount("/app", StaticFiles(directory="templates/dist", html=True), name="frontend")

# ---------- AUTH HELPERS ----------
def get_password_hash(password: str):
    """
    Хешує пароль користувача перед збереженням у базу даних.

    Hashes a user's password before storing it in the database.
    """
    return password_hash.hash(password)

def verify_password(plain, hashed):
    """
    Перевіряє чи співпадає введений пароль
    з хешованим паролем у базі даних.

    Verifies whether the provided plain password
    matches the stored hashed password.
    """
    return password_hash.verify(plain, hashed)

def create_access_token(data: dict):
    """
    Створює JWT токен доступу з обмеженим терміном дії.

    Creates a JWT access token with an expiration time.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    session: SessionDep,
    request: Request,
    token: Annotated[Optional[str], Depends(oauth2_scheme)]
) -> User:
    """
    Отримує поточного автентифікованого користувача
    на основі JWT токена.
    Токен може передаватися через Authorization header
    або через cookie.

    Retrieves the currently authenticated user
    based on the provided JWT token.
    The token can be passed via Authorization header
    or stored in cookies.
    """
    if not token:
        token = request.cookies.get("access_token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        if token.startswith("Bearer "):
            token = token.split(" ")[1]

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise credentials_exception

    return user

from fastapi.responses import RedirectResponse

# redirect to app
@app.get("/")
def main():
    """
    Перенаправляє користувача на frontend-застосунок.

    Redirects the user to the frontend application.
    """
    return RedirectResponse(url="/app/")


# ---------- AUTH ROUTES ----------
from fastapi import Body

from fastapi import Body

@app.post("/register", response_model=Token)
def register_and_login(
    session: SessionDep,  # <- спочатку сесія
    user_in: UserCreate = Body(...)
):
    """
    Реєструє нового користувача.
    Перевіряє унікальність username,
    зберігає хешований пароль у базі
    та повертає JWT токен.

    Registers a new user.
    Ensures the username is unique,
    stores the hashed password,
    and returns a JWT token.
    """
    existing = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # створюємо токен після реєстрації
    token = create_access_token(data={"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}



@app.post("/token", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    """
    Виконує автентифікацію користувача.
    Перевіряє username та пароль
    і повертає JWT токен.

    Authenticates a user.
    Verifies username and password
    and returns a JWT token.
    """
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# ТРЕКЕР
@app.post("/transactions/", response_model=TransactionRead)
def create_transaction(
    data: TransactionCreate,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Створює нову фінансову транзакцію
    для поточного користувача.

    Creates a new financial transaction
    for the authenticated user.
    """
    db_tx = Transaction(**data.model_dump(), user_id=user.id)
    session.add(db_tx)
    session.commit()
    session.refresh(db_tx)
    return db_tx

@app.get("/transactions/", response_model=List[TransactionRead])
def get_transactions(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
    offset: int = 0,
    limit: int = Query(default=10, le=100),
    category: Optional[str] = None
):
    """
    Повертає список транзакцій користувача
    з можливістю пагінації та фільтрації за категорією.

    Returns a list of user transactions
    with optional pagination and category filtering.
    """
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
    """
    Видаляє транзакцію користувача за її ID.
    Доступно лише власнику транзакції.

    Deletes a transaction by ID.
    Only accessible to the transaction owner.
    """
    tx = session.get(Transaction, tx_id)
    if not tx or tx.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    session.delete(tx)
    session.commit()
    return {"ok": True}

@app.get("/balance")
def get_balance(session: SessionDep, user: Annotated[User, Depends(get_current_user)]):
    """
    Обчислює поточний баланс користувача
    як суму всіх його транзакцій.

    Calculates the user's current balance
    as the sum of all their transactions.
    """
    transactions = session.exec(select(Transaction).where(Transaction.user_id == user.id)).all()
    total = sum(t.amount for t in transactions)
    return {"balance": total, "count": len(transactions)}

# ---------- LOGOUT ----------
@app.get("/logout")
def logout():
    """
    Виконує вихід користувача,
    видаляючи JWT токен із cookie.

    Logs the user out
    by removing the JWT token from cookies.
    """
    response = RedirectResponse(url="/")
    response.delete_cookie("access_token")
    return response

@app.get("/api/currency/rates")
async def get_currency_rates():
    return {
        "rates": currency_service.current_rates,
        "last_update": currency_service.last_update.strftime("%H:%M:%S")
        if currency_service.last_update else None
    }

@app.get("/api/currency/update")
async def update_currency_rates():
    rates = await currency_service.fetch_rates(force_update=True)
    return {
        "rates": rates,
        "last_update": currency_service.last_update.strftime("%H:%M:%S")
    }
