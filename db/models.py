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
# class Goal(SQLModel, table=True):
#     __tablename__ = "goals"

#     id: Optional[int] = Field(default=None, primary_key=True)
#     title: str
#     target_amount: float
#     monthly_contribution: float
#     current_savings: float = Field(default=0.0)

#     # Зовнішній ключ
#     owner_id: int = Field(foreign_key="users.id")
#     # Зворотній зв'язок
#     owner: Optional[User] = Relationship(back_populates="goals")


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



from __future__ import annotations

from datetime import date, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, Field, Relationship, Session, create_engine, select


# ===========================
# 1) МОДЕЛІ (таблиці бази даних)
# ===========================

class User(SQLModel, table=True):
    """
    Таблиця користувачів.
    У кожного користувача є свої цілі (wishlist) і свої транзакції (tracker).
    """
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str

    # Списки пов'язаних об'єктів (One-to-Many)
    wishlist_items: List["WishlistItem"] = Relationship(back_populates="owner")
    tracker_entries: List["TrackerEntry"] = Relationship(back_populates="owner")


class WishlistItem(SQLModel, table=True):
    """
    Таблиця wishlist (цілі).
    Наприклад: "Новий ноутбук" за 35000.
    """
    __tablename__ = "wishlist"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str                 # назва цілі
    price: float              # ціна цілі
    priority: int = Field(default=1)   # пріоритет (1 = найважливіше)
    is_bought: bool = Field(default=False)  # чи вже купили (чекбокс)

    # owner_id показує, кому належить ця ціль
    owner_id: int = Field(foreign_key="users.id")
    owner: Optional[User] = Relationship(back_populates="wishlist_items")


class TrackerEntry(SQLModel, table=True):
    """
    Таблиця tracker (транзакції).

    ВАЖЛИВО:
    - type = "income" або "expense"
    - amount завжди додатнє число
    - net за місяць = income_sum - expense_sum
    """
    __tablename__ = "tracker"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: str  # "income" | "expense"
    amount: float
    entry_date: date = Field(default_factory=date.today)

    owner_id: int = Field(foreign_key="users.id")
    owner: Optional[User] = Relationship(back_populates="tracker_entries")


# ===========================
# 1.1) DTO (схеми для запитів) - НЕ таблиці
# ===========================

class WishlistCreate(SQLModel):
    """
    Це модель для POST-запиту (додати нову ціль).
    Вона НЕ створює таблицю, бо table=False за замовчуванням.
    """
    name: str
    price: float
    priority: int = 1


class WishlistUpdate(SQLModel):
    """
    Це модель для PATCH-запиту (оновити ціль).
    Поля optional, бо можна оновлювати частково.
    """
    name: Optional[str] = None
    price: Optional[float] = None
    priority: Optional[int] = None
    is_bought: Optional[bool] = None


# ===========================
# 2) БАЗА ДАНИХ
# ===========================

engine = create_engine("sqlite:///app.db", echo=False)


def create_db_and_tables() -> None:
    """Створює таблиці в БД, якщо їх ще нема."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Дає сесію для роботи з БД (FastAPI залежність)."""
    with Session(engine) as session:
        yield session


# ===========================
# 3) ДОПОМІЖНІ ФУНКЦІЇ (розрахунки)
# ===========================

def month_key(d: date) -> str:
    """
    Перетворює дату в ключ виду '2026-02', щоб групувати транзакції по місяцях.
    """
    return f"{d.year:04d}-{d.month:02d}"


def average_monthly_net(session: Session, user_id: int, months_back: int = 3) -> float:
    """
    Рахує "середній плюс за місяць" за останні months_back місяців.

    net за місяць = сума доходів - сума витрат

    Якщо average <= 0 -> повертаємо 0, бо прогноз тоді неможливий.
    """
    start = date.today() - timedelta(days=months_back * 31)

    entries = session.exec(
        select(TrackerEntry)
        .where(TrackerEntry.owner_id == user_id)
        .where(TrackerEntry.entry_date >= start)
    ).all()

    if not entries:
        return 0.0

    income_by_month: Dict[str, float] = {}
    expense_by_month: Dict[str, float] = {}

    for e in entries:
        k = month_key(e.entry_date)

        if e.type == "income":
            income_by_month[k] = income_by_month.get(k, 0.0) + float(e.amount)

        elif e.type == "expense":
            expense_by_month[k] = expense_by_month.get(k, 0.0) + float(e.amount)

    months = set(income_by_month.keys()) | set(expense_by_month.keys())
    if not months:
        return 0.0

    nets: List[float] = []
    for m in months:
        inc = income_by_month.get(m, 0.0)
        exp = expense_by_month.get(m, 0.0)
        nets.append(inc - exp)

    avg = sum(nets) / float(len(nets))
    return avg if avg > 0 else 0.0


# ===========================
# 4) API (FastAPI)
# ===========================

app = FastAPI()


@app.on_event("startup")
def on_startup():
    """Коли сервер стартує — створюємо таблиці."""
    create_db_and_tables()


def get_current_user_id() -> int:
    """
    ЗАГЛУШКА.
    Зараз повертаємо 1.
    Коли буде авторизація — тут треба брати user_id з токена/сесії.
    """
    return 1


# ---------------------------
# 4.1) GET: дані для Wishlist сторінки (progress + прогноз)
# ---------------------------

@app.get("/wishlist/summary")
def wishlist_summary(session: Session = Depends(get_session)):
    """
    Ендпоінт для Wishlist сторінки:

    Повертає:
    - overall прогрес (completed/total/%)
    - items список цілей
    - forecast прогноз (скільки місяців до цілі)
    """
    user_id = get_current_user_id()

    # перевірка, що користувач існує
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # дістаємо всі цілі користувача
    items = session.exec(
        select(WishlistItem)
        .where(WishlistItem.owner_id == user_id)
        .order_by(
            WishlistItem.is_bought.asc(),
            WishlistItem.priority.asc(),
            WishlistItem.id.asc()
        )
    ).all()

    # загальні суми
    total = sum(float(i.price) for i in items)
    completed = sum(float(i.price) for i in items if i.is_bought)

    # % прогресу (якщо total = 0, тоді 0%)
    progress_percent = (completed / total * 100.0) if total > 0 else 0.0

    # середній плюс за місяць
    avg_net = average_monthly_net(session, user_id=user_id, months_back=3)

    # прогноз для кожної цілі (простий варіант: окремо по кожній цілі)
    forecasts: List[Dict[str, Any]] = []
    today = date.today()

    for i in items:
        # якщо куплено — прогноз 0
        if i.is_bought:
            forecasts.append({
                "id": i.id,
                "name": i.name,
                "price": float(i.price),
                "months_to_goal": 0,
                "eta_date": str(today),
            })
            continue

        # якщо середній плюс <= 0 — прогноз не можемо порахувати
        if avg_net <= 0:
            forecasts.append({
                "id": i.id,
                "name": i.name,
                "price": float(i.price),
                "months_to_goal": None,
                "eta_date": None,
            })
            continue

        # ГОЛОВНА ФОРМУЛА:
        # якщо в середньому "в плюс" на avg_net за місяць,
        # то ціна / avg_net = кількість місяців
        months = float(i.price) / avg_net

        # приблизна дата (дуже грубо: 30 днів = 1 місяць)
        eta = today + timedelta(days=int(months * 30))

        forecasts.append({
            "id": i.id,
            "name": i.name,
            "price": float(i.price),
            "months_to_goal": round(months, 1),
            "eta_date": str(eta),
        })

    # повертаємо JSON для фронтенду
    return {
        "overall": {
            "total": round(total, 2),
            "completed": round(completed, 2),
            "progress_percent": round(progress_percent, 1),
            "avg_monthly_net": round(avg_net, 2),
        },
        "items": [
            {
                "id": i.id,
                "name": i.name,
                "price": float(i.price),
                "priority": i.priority,
                "is_bought": i.is_bought
            }
            for i in items
        ],
        "forecast": forecasts,
    }


# ---------------------------
# 4.2) POST: додати нову ціль (Add Goal)
# ---------------------------

@app.post("/wishlist")
def create_wishlist_item(payload: WishlistCreate, session: Session = Depends(get_session)):
    """
    Створює нову ціль для поточного користувача.

    Фронт може відправити JSON:
    {
      "name": "Новий ноутбук",
      "price": 35000,
      "priority": 2
    }
    """
    user_id = get_current_user_id()

    # перевіряємо користувача
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # створюємо запис у wishlist
    item = WishlistItem(
        name=payload.name,
        price=float(payload.price),
        priority=int(payload.priority),
        is_bought=False,
        owner_id=user_id
    )

    session.add(item)
    session.commit()
    session.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "price": float(item.price),
        "priority": item.priority,
        "is_bought": item.is_bought
    }


# ---------------------------
# 4.3) PATCH: переключити чекбокс (toggle is_bought)
# ---------------------------

@app.patch("/wishlist/{item_id}/toggle")
def toggle_wishlist_item(item_id: int, session: Session = Depends(get_session)):
    """
    Перемикає is_bought для цілі:
    True -> False
    False -> True

    Зручно для чекбокса на фронті.
    """
    user_id = get_current_user_id()

    item = session.get(WishlistItem, item_id)
    if not item or item.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    item.is_bought = not item.is_bought

    session.add(item)
    session.commit()
    session.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "price": float(item.price),
        "priority": item.priority,
        "is_bought": item.is_bought
    }


# ---------------------------
# 4.4) PATCH: оновити ціль (частково)
# ---------------------------

@app.patch("/wishlist/{item_id}")
def update_wishlist_item(item_id: int, payload: WishlistUpdate, session: Session = Depends(get_session)):
    """
    Оновлює ціль частково.

    Наприклад, фронт може відправити:
    { "is_bought": true }

    або
    { "name": "Подорож", "price": 25000 }
    """
    user_id = get_current_user_id()

    item = session.get(WishlistItem, item_id)
    if not item or item.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    # Оновлюємо тільки ті поля, які прийшли (не None)
    if payload.name is not None:
        item.name = payload.name
    if payload.price is not None:
        item.price = float(payload.price)
    if payload.priority is not None:
        item.priority = int(payload.priority)
    if payload.is_bought is not None:
        item.is_bought = bool(payload.is_bought)

    session.add(item)
    session.commit()
    session.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "price": float(item.price),
        "priority": item.priority,
        "is_bought": item.is_bought
    }


# ---------------------------
# 4.5) DELETE: видалити ціль (Delete Goal)
# ---------------------------

@app.delete("/wishlist/{item_id}")
def delete_wishlist_item(item_id: int, session: Session = Depends(get_session)):
    """
    Видаляє ціль з wishlist.

    Використовується, наприклад:
    - кнопка "Delete"
    - іконка кошика
    - підтвердження "Are you sure?"
    """
    user_id = get_current_user_id()

    item = session.get(WishlistItem, item_id)
    if not item or item.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    session.delete(item)
    session.commit()

    return {
        "status": "ok",
        "deleted_item_id": item_id
    }