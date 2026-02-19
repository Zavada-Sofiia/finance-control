from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- User Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8)
    email: Optional[EmailStr] = None

class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str]

# --- Transaction Schemas ---
class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None

class TransactionRead(TransactionCreate):
    id: int
    timestamp: datetime

class WishlistCreate(BaseModel):
    name: str
    price: float
    priority: int = 1


class WishlistRead(WishlistCreate):
    id: int
    is_bought: bool

# --- Goal CRUD Schemas ---
# class GoalCreate(BaseModel):
#     title: str
#     target_amount: float
#     monthly_contribution: float

# class GoalRead(GoalCreate):
#     id: int
#     current_savings: float

# --- Goal/Forecast Schemas ---
#class GoalForecast(BaseModel):
    #target_amount: float
    #monthly_contribution: float
    #current_savings: float = 0
    #extra_expense: Optional[float] = 0
