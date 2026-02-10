from pydantic import BaseModel
from typing import Optional

class GoalForecast(BaseModel):
    target_amount: float        # Загальна сума цілі 
    monthly_contribution: float # Щомісячний внесок 
    current_savings: float = 0  # Скільки вже відкладено
    extra_expense: Optional[float] = 0  # Для сценарію "покупка з вішліста" [cite: 64]
