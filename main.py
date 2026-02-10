from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional

import jwt, sys
from fastapi import FastAPI, HTTPException, status, Depends, Query, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from pathlib import Path

from db.database import create_db_and_tables, get_session
from db.models import User, Transaction, Goal, WishlistItem  # Моделі БД
from schemas.schemas import UserCreate, UserRead, Token, TransactionCreate, TransactionRead # Pydantic схеми

templates = Jinja2Templates(directory="templates")

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# --- КОНФІГУРАЦІЯ ---
SECRET_KEY = Path(__file__).resolve().parent / "core" / "secret_key"
SECRET_KEY = SECRET_KEY.read_text(encoding="utf-8").strip()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
app = FastAPI(title="Finance Tracker API", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

SessionDep = Annotated[Session, Depends(get_session)]

# --- ФУНКЦІЇ БЕЗПЕКИ ---
def get_password_hash(password: str):
    return password_hash.hash(password)

def verify_password(plain, hashed):
    return password_hash.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    session: SessionDep,
    request: Request,
    token: Annotated[Optional[str], Depends(oauth2_scheme)]
) -> User:

    # Якщо FastAPI не знайшов токен у заголовку, шукаємо в куках
    if not token:
        token = request.cookies.get("access_token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    # Валідація токена
    try:
        # Прибираємо "Bearer "
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

    response = JSONResponse({
        "access_token": token,
        "token_type": "bearer"
    })
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax"
    )

    return response

# --- Ендпоінти транзакцій ---

@app.post("/transactions/", response_model=TransactionRead)
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
    transactions = session.exec(select(Transaction).where(Transaction.user_id == user.id)).all()
    total = sum(t.amount for t in transactions)
    return {"balance": total, "count": len(transactions)}

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request" : request})


# --- HTML ---
@app.get("/log", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(
        "auth/login.html",
        {"request": request}
    )

@app.get("/reg", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse(
        "auth/register.html",
        {"request": request}
    )

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(
    request: Request,
    session: SessionDep,
    user: Annotated[User, Depends(get_current_user)]
):

    txs = session.exec(
        select(Transaction).where(Transaction.user_id == user.id)
    ).all()

    balance = sum(t.amount for t in txs)

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": user.username,
            "transactions": txs,
            "balance": balance,
        }
    )

from fastapi.responses import RedirectResponse

@app.post("/logout")
def logout():
    response = RedirectResponse(url="/log")
    response.delete_cookie("access_token")
    return response
