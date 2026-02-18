import math
from typing import Optional
class GoalCalculator:
    def __init__(self, target_amount: float, monthly_contribution: float, current_savings: float = 0):
        self.target_amount = target_amount
        self.monthly_contribution = monthly_contribution
        self.current_savings = current_savings

    def calculate_duration(self) -> float:
        """
        Розраховує кількість місяців до досягнення цілі.
        60 000 грн при внеску 3 000 грн -> 20 місяців.
        """
        remaining_amount = self.target_amount - self.current_savings
        if remaining_amount <= 0:
            return 0
        if self.monthly_contribution <= 0:
            return float('inf')
        return round(remaining_amount / self.monthly_contribution, 1)

    def simulate_what_if(
        self,
        purchase_cost: Optional[float] = 0,
        contribution_change: Optional[float] = 0
    ) -> dict:
        """
        Моделювання сценаріїв.
        Показує, як зміна внеску або покупка впливає на дату досягнення.
        """
        current_months = self.calculate_duration()

        new_contribution = self.monthly_contribution + contribution_change
        new_savings = self.current_savings - (purchase_cost or 0)

        modified = GoalCalculator(self.target_amount, new_contribution, new_savings)
        new_months = modified.calculate_duration()

        delay = round(new_months - current_months, 1)

        return {
            "current_forecast_months": current_months,
            "new_forecast_months": new_months,
            "impact_months": delay,
            "message": (
                f"Ціль відкладається на {abs(delay)} місяців"
                if delay > 0
                else f"Ціль буде досягнута на {abs(delay)} місяців раніше"
            )
        }
