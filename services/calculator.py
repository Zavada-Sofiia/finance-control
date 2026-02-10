import math
from typing import Optional

def calculate_goal_duration(target_amount: float, monthly_contribution: float, current_savings: float = 0) -> float:
    """
    Розраховує кількість місяців до досягнення цілі.
    60 000 грн при внеску 3 000 грн -> 20 місяців.
    """
    remaining_amount = target_amount - current_savings
    if remaining_amount <= 0:
        return 0
    if monthly_contribution <= 0:
        return float('inf')  # ціль недосяжна при нульовому внеску

    return round(remaining_amount / monthly_contribution, 1)

def simulate_what_if(
    target_amount: float,
    monthly_contribution: float,
    current_savings: float,
    purchase_cost: Optional[float] = 0,
    contribution_change: Optional[float] = 0
):
    """
    Моделювання сценаріїв.
    Показує, як зміна внеску або покупка впливає на дату досягнення.
    """
    #поточний прогноз
    current_months = calculate_goal_duration(target_amount, monthly_contribution, current_savings)

    #змінений внесок
    new_contribution = monthly_contribution + contribution_change

    #урахування покупки (гроші віднімаються від заощаджень)
    if purchase_cost is not None:
        new_savings = current_savings - purchase_cost
    else:
        new_savings = current_savings

    new_months = calculate_goal_duration(target_amount, new_contribution, new_savings)

    delay = new_months - current_months

    return {
        "current_forecast_months": current_months,
        "new_forecast_months": new_months,
        "impact_months": round(delay, 1),
        "message": f"Ціль відкладається на {abs(delay)} місяців" \
if delay > 0 else f"Ціль буде досягнута на {abs(delay)} місяців раніше"
    }
