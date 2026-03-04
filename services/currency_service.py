"""
services/currency_service.py

Сервіс для отримання актуальних курсів валют.
Підключається до FastAPI через lifespan і оновлює курси кожні 30 секунд.
"""

import asyncio
import httpx
from datetime import datetime
from typing import Optional

SPREAD = 0.015  # 1.5%

CURRENCY_META = {
    "USD": {"flag": "🇺🇸", "amount": 1},
    "EUR": {"flag": "🇪🇺", "amount": 1},
    "GBP": {"flag": "🇬🇧", "amount": 1},
    "CAD": {"flag": "🇨🇦", "amount": 100},
    "PLN": {"flag": "🇵🇱", "amount": 10},
    "CZK": {"flag": "🇨🇿", "amount": 10},
    "JPY": {"flag": "🇯🇵", "amount": 10},
}

DEFAULT_RATES = {
    "USD": {"flag": "🇺🇸", "name": "USD", "buy": 40.40, "sell": 40.80, "trend": "neutral"},
    "EUR": {"flag": "🇪🇺", "name": "EUR", "buy": 50.45, "sell": 50.80, "trend": "neutral"},
    "GBP": {"flag": "🇬🇧", "name": "GBP", "buy": 55.55, "sell": 56.20, "trend": "neutral"},
    "CAD": {"flag": "🇨🇦", "name": "CAD (100)", "buy": 28.80, "sell": 29.50, "trend": "neutral"},
    "PLN": {"flag": "🇵🇱", "name": "PLN (10)", "buy": 9.26, "sell": 9.59, "trend": "neutral"},
    "CZK": {"flag": "🇨🇿", "name": "CZK (10)", "buy": 1.65, "sell": 1.70, "trend": "neutral"},
    "JPY": {"flag": "🇯🇵", "name": "JPY (10)", "buy": 2.60, "sell": 2.70, "trend": "neutral"},
}


class CurrencyService:
    def __init__(self):
        self.current_rates: dict = {}
        self.previous_rates: dict = {}
        self.last_update: Optional[datetime] = None
        self._task: Optional[asyncio.Task] = None

    def _calculate_trend(self, code: str, rate: float) -> str:
        if code not in self.previous_rates:
            self.previous_rates[code] = rate
            return "neutral"
        prev = self.previous_rates[code]
        self.previous_rates[code] = rate
        if rate > prev:
            return "up"
        elif rate < prev:
            return "down"
        return "neutral"

    def _format(self, raw_rates: dict) -> dict:
        result = {}
        for code, meta in CURRENCY_META.items():
            if code not in raw_rates or raw_rates[code] == 0:
                continue
            amount = meta["amount"]
            base = amount / raw_rates[code]
            buy = round(base * (1 - SPREAD), 4)
            sell = round(base * (1 + SPREAD), 4)
            trend = self._calculate_trend(code, base)
            name = code if amount == 1 else f"{code} ({amount})"
            result[code] = {
                "flag": meta["flag"],
                "name": name,
                "buy": buy,
                "sell": sell,
                "trend": trend,
            }
        self.current_rates = result
        self.last_update = datetime.now()
        return result


    async def fetch_rates(self, force_update: bool = False) -> dict:
        if not force_update and self.current_rates:
            return self.current_rates

        async with httpx.AsyncClient(timeout=5) as client:
            try:
                resp = await client.get("https://bank.gov.ua/NBU_Exchange/exchange_site?json")
                if resp.status_code == 200:
                    data = resp.json()
                    # NBU: rate = UAH per 1 foreign unit → invert for _format
                    raw = {
                        item["cc"]: 1 / item["rate"]
                        for item in data
                        if item.get("rate") and item.get("cc") in CURRENCY_META
                    }
                    if raw:
                        return self._format(raw)
            except Exception as e:
                print(f"[CurrencyService] Error fetching NBU: {e}")

            for url in [
                "https://api.exchangerate-api.com/v4/latest/UAH",
                "https://open.er-api.com/v6/latest/UAH",
            ]:
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw = data.get("rates") or data.get("conversion_rates", {})
                        if raw:
                            return self._format(raw)
                except Exception as e:
                    print(f"[CurrencyService] Error fetching {url}: {e}")

        self.current_rates = DEFAULT_RATES
        self.last_update = datetime.now()
        return DEFAULT_RATES
    
    async def fetch_history(self, code: str, days: int = 10) -> list[dict]:
        from datetime import timedelta
        end = datetime.now()
        start = end - timedelta(days=days)
        url = (
            f"https://bank.gov.ua/NBU_Exchange/exchange_site"
            f"?start={start.strftime('%Y%m%d')}"
            f"&end={end.strftime('%Y%m%d')}"
            f"&valcode={code.lower()}&json"
        )
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            data = resp.json()
            return [
                {
                    "date": r["exchangedate"],
                    "buy":  round(r["rate"] * (1 - SPREAD), 4),
                    "sell": round(r["rate"] * (1 + SPREAD), 4),
                }
                for r in data
            ]

    async def _auto_update_loop(self):
        while True:
            try:
                await self.fetch_rates()
                print(f"[CurrencyService] ✓ Updated at {self.last_update.strftime('%H:%M:%S')}")
            except Exception as e:
                print(f"[CurrencyService] ✗ Error: {e}")
            await asyncio.sleep(30)

    def start(self):
        """Запускає фонове оновлення. Викликати з lifespan."""
        self._task = asyncio.create_task(self._auto_update_loop())

    def stop(self):
        """Зупиняє фонове оновлення."""
        if self._task:
            self._task.cancel()


# Singleton — імпортуй його у main.py
currency_service = CurrencyService()
