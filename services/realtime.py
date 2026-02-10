def get_currency_advice(current_rate: float, avg_90_days: float):
    """Дає аналітичну підказку щодо вигідності обміну[cite: 54]."""
    if current_rate > avg_90_days * 1.05:
        return "Поточний курс долара на 5% вищий за середній за 90 днів — історично невигідний момент для обміну" [cite: 55]
    return "Курс стабільний, можна розглядати обмін" [cite: 59]
