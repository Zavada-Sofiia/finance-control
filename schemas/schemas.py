from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- User Schemas ---
class UserCreate(BaseModel):
    password: str = Field(..., min_length=8)
    password: str = Field(..., min_length=8)
    email: Optional[EmailStr] = None

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self

class UserRead(BaseModel):
    id: int
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
