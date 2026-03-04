"""
Finance Control App — FastAPI + React
"""
import smtplib
from contextlib import asynccontextmanager
import random
from email.message import EmailMessage


from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, List, Optional

import os
import jwt

from fastapi import APIRouter

from services.currency_service import currency_service

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
from schemas.schemas import ForgotPasswordRequest, ResetPasswordRequest

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

SECRET_KEY = (Path(__file__).resolve().parent / "core" / "secret_key").read_text().strip()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

from dotenv import load_dotenv
load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI(title="Finance Tracker API", lifespan=lifespan)

# Папка dist — збірка React/Vite
# Serve static assets (JS, CSS, images) directly
app.mount("/app/assets", StaticFiles(directory="./templates/dist/assets"), name="assets")

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
    print("Authorization header:", request.headers.get("authorization"))
    print("Cookie access_token:", request.cookies.get("access_token"))
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    print("Token before decode:", token)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        print("Payload:", payload)
    except InvalidTokenError as e:
        print("Invalid token error:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

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
    print(user)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# ТРЕКЕР
@app.get("/transactions/", response_model=List[TransactionRead])
def get_transactions(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
    offset: int = 0,
    limit: int = Query(default=100, le=200),
):
    """
    Створює нову фінансову транзакцію
    для поточного користувача.

    Creates a new financial transaction
    for the authenticated user.
    """
    query = select(Transaction).where(Transaction.user_id == user.id)
    return session.exec(query.offset(offset).limit(limit)).all()

@app.post("/transactions/", response_model=TransactionRead)
def create_transaction(
    data: TransactionCreate,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Creates a new financial transaction for the authenticated user.

    Args:
        data (TransactionCreate): Transaction data provided in the request body.
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        TransactionRead: The created transaction object.
    """
    transaction = Transaction(
        **data.model_dump(),
        user_id=user.id,
    )
    print(transaction)
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@app.get("/transactions/expenses", response_model=List[TransactionRead])
def get_expenses(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns all expense transactions for the authenticated user.

    Args:
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        List[TransactionRead]: List of user's expense transactions.
    """
    statement = select(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.type == "expenses"
    )
    return session.exec(statement).all()

@app.get("/transactions/income", response_model=List[TransactionRead])
def get_income(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns all income transactions for the authenticated user.

    Args:
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        List[TransactionRead]: List of user's income transactions.
    """
    statement = select(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.type == "income"
    )
    return session.exec(statement).all()

@app.delete("/transactions/{tx_id}")
def delete_transaction(
    tx_id: str,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Deletes a transaction by its ID.

    Only the owner of the transaction can delete it.

    Args:
        tx_id (str): ID of the transaction to delete.
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        dict: Confirmation message {"ok": True}.

    Raises:
        HTTPException: If the transaction does not exist
        or does not belong to the user.
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
    """
    Returns the latest available currency exchange rates.

    The rates are provided from the in-memory currency service cache.
    If rates have not been updated yet, the timestamp may be None.

    Returns:
        dict: A dictionary containing:
            - rates (dict): Current currency exchange rates.
            - last_update (str | None): Time of the last update
            formatted as HH:MM:SS, or None if not available.
    """
    return {
        "rates": currency_service.current_rates,
        "last_update": currency_service.last_update.strftime("%H:%M:%S")
        if currency_service.last_update else None
    }

@app.get("/api/currency/update")
async def update_currency_rates():
    """
    Forces an immediate update of currency exchange rates.

    Fetches fresh exchange rates from the external provider
    and updates the in-memory cache.

    Returns:
        dict: A dictionary containing:
            - rates (dict): Updated currency exchange rates.
            - last_update (str): Time of the update
            formatted as HH:MM:SS.
    """
    rates = await currency_service.fetch_rates(force_update=True)
    return {
        "rates": rates,
        "last_update": currency_service.last_update.strftime("%H:%M:%S")
    }

wishlist_router = APIRouter()

@wishlist_router.get("/wishlist/", response_model=List[WishlistRead])
def get_wishlist(
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Returns all wishlist items for the authenticated user.

    Only items that belong to the currently logged-in
    user are returned.

    Args:
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        List[WishlistRead]: List of wishlist items owned by the user.
    """
    items = session.exec(
        select(WishlistItem).where(WishlistItem.owner_id == user.id)
    ).all()
    return items

@wishlist_router.post("/wishlist/", response_model=WishlistRead)
def create_wishlist_item(
    data: WishlistCreate,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Creates a new wishlist item for the authenticated user.

    The item is stored in the database and linked
    to the current user via the `owner_id` field.

    Args:
        data (WishlistCreate): Data for the new wishlist item.
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        WishlistRead: The created wishlist item.
    """
    item = WishlistItem(**data.model_dump(), owner_id=user.id)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

# Змінити статус покупки (is_bought)
@wishlist_router.patch("/wishlist/{item_id}", response_model=WishlistRead)
def toggle_wishlist_item(
    item_id: int,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Toggles the purchase status of a wishlist item.

    The `is_bought` field is switched between True and False.
    Only the owner of the item is allowed to modify it.

    Args:
        item_id (int): ID of the wishlist item.
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        WishlistRead: The updated wishlist item.

    Raises:
        HTTPException: If the item does not exist
        or does not belong to the current user.
    """
    item = session.get(WishlistItem, item_id)
    if not item or item.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_bought = not item.is_bought
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

# Видалити мрію
@wishlist_router.delete("/wishlist/{item_id}")
def delete_wishlist_item(
    item_id: int,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Deletes a wishlist item by its ID.

    Only the owner of the item is allowed to delete it.

    Args:
        item_id (int): ID of the wishlist item.
        session (Session): Active database session.
        user (User): Currently authenticated user.

    Returns:
        dict: Confirmation message {"ok": True}.

    Raises:
        HTTPException: If the item does not exist
        or does not belong to the current user.
    """
    item = session.get(WishlistItem, item_id)
    if not item or item.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}

# Підключаємо роутер до основного додатку
app.include_router(wishlist_router)


def send_email(to_email: str, subject: str, body: str):
    """
    Sends an email using the configured SMTP server.

    Establishes a secure TLS connection,
    authenticates using environment credentials,
    and sends a plain text email.

    Args:
        to_email (str): Recipient email address.
        subject (str): Email subject line.
        body (str): Email body content.

    Raises:
        Exception: If the SMTP connection,
        authentication, or sending fails.
    """
    try:
        msg = EmailMessage()
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        # Підключення до SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # TLS шифрування
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"Email sent to {to_email}")

    except Exception as e:
        print("Error sending email:", e)
        raise

reset_storage = {}

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, session: SessionDep):
    """
    Initiates the password reset process.

    Generates a temporary 6-digit reset code,
    stores it in memory with an expiration time,
    and sends it to the user's registered email address.

    A generic response is returned to prevent
    account enumeration attacks.

    Args:
        data (ForgotPasswordRequest): Contains the username.
        session (Session): Active database session.

    Returns:
        dict: Confirmation message indicating that
        a reset code was sent (if the account exists).
    """
    clean_expired_reset_codes()

    user = session.exec(
        select(User).where(User.username == data.username)
    ).first()

    if not user or not user.email:
        return {"detail": "If account exists, reset code sent"}

    code = str(random.randint(100000, 999999))

    reset_storage[data.username] = {
        "code": code,
        "expire": datetime.now(timezone.utc) + timedelta(minutes=5)
    }

    body = f"Your password reset code is: {code}\nIt expires in 5 minute."

    send_email(user.email, "Reset password", body)

    return {"detail": "Reset code sent"}

@app.post("/reset-password")
def reset_password(data: ResetPasswordRequest, session: SessionDep):
    """
    Resets the user's password using a valid reset code.

    Validates the reset request, verifies the code,
    updates the hashed password in the database,
    and removes the temporary reset record.

    Args:
        data (ResetPasswordRequest): Contains username,
            reset code, and new password.
        session (Session): Active database session.

    Returns:
        dict: Confirmation message {"detail": "Password updated"}.

    Raises:
        HTTPException:
            - If no reset request exists
            - If the code is invalid
            - If the user does not exist
    """
    clean_expired_reset_codes()

    stored = reset_storage.get(data.username)

    if not stored:
        raise HTTPException(status_code=400, detail="No reset request")

    if stored["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    user = session.exec(
        select(User).where(User.username == data.username)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid user")

    user.hashed_password = get_password_hash(data.new_password)
    session.add(user)
    session.commit()

    del reset_storage[data.username]

    return {"detail": "Password updated"}

def clean_expired_reset_codes():
    """
    Removes expired password reset codes from in-memory storage.

    Checks all stored reset requests and deletes
    those whose expiration timestamp has passed.
    """
    now = datetime.now(timezone.utc)

    expired_users = [
        username
        for username, data in reset_storage.items()
        if data["expire"] < now
    ]

    for username in expired_users:
        del reset_storage[username]


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """
    Returns the application's favicon file.

    This endpoint is excluded from the OpenAPI schema
    and is used by browsers to display the site icon.
    """
    return FileResponse(Path("./templates/assets/favicon.ico"))



@app.get("/api/currency/history")
async def get_currency_history():
    usd = await currency_service.fetch_history("USD")
    eur = await currency_service.fetch_history("EUR")

    by_date = {}
    for r in usd:
        by_date.setdefault(r["date"], {"date": r["date"]})["USD_buy"]  = r["buy"]
        by_date[r["date"]]["USD_sell"] = r["sell"]
    for r in eur:
        by_date.setdefault(r["date"], {"date": r["date"]})["EUR_buy"]  = r["buy"]
        by_date[r["date"]]["EUR_sell"] = r["sell"]

    return sorted(by_date.values(), key=lambda x: x["date"])
@app.get("/app/{full_path:path}")
def serve_spa(full_path: str):
    index = Path("./templates/dist/index.html")
    return FileResponse(index)
