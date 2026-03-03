# 📊 Finance Tracker API
This project is a modern RESTful API for **personal finance tracking**, built with FastAPI. <br>
It allows users to manage their income and expenses securely using JWT authentication.

### URL: https://finance-control-uhfl.onrender.com

## 🚀 Core Features
### User Security:
User registration with unique usernames.
Secure authentication using OAuth2 and JWT tokens.
Password hashing using recommended security standards.
### Transaction Management:
Create transactions where positive amounts represent income and negative amounts represent expenses.
Retrieve a list of transactions with support for pagination (limit, offset) and category filtering.
Delete specific transactions owned by the authenticated user
### Balance Analytics:
View the total current balance and the total count of transactions.

## 🛠 Tech Stack
Language: Python 3.13, TypeScript, CSS <br>
Framework: FastAPI<br>
Database (ORM): <br>

### 📁 Project Structure

./<br>
├── README.md<br>
├── core<br>
│   └── secret_key  # holds secret key<br>
├── db              # holds db logic<br>
│   ├── __init__.py<br>
│   ├── database.py<br>
│   └── models.py<br>
├── finance_database.db # database<br>
├── main.py             # server<br>
├── requirements.txt    # pip requirements<br>
├── schemas             # pydantic schemas<br>
│   └── schemas.py<br>
├── services            # services of the project<br>
│   ├── calculator.py<br>
│   └── currency_service.py<br>
└── templates           # frontend<br>
    │   ...<br>
    └── dist            # frontend that loads<br>
        ├── assets<br>
        │   ├── currency_back_img-CyxF1tBA.png<br>
        │   ├── home_back_img-CUMFBhVz.png<br>
        │   ├── index-BWdXUAo6.css<br>
        │   ├── index-BZjiwzpO.js<br>
        │   ├── login_back_img-BJTVgwyR.png<br>
        │   └── wish_list_back_img-C9Et085K.png<br>
        └── index.html<br>

## Authentication & User Security Layer
This module ensures secure user access and data protection.

### Core Features:
User registration with unique usernames <br>
Password hashing using secure standards <br>

### Security Model:
Passwords are never stored in plain text <br>
JWT tokens include user identity payload <br>
Each protected endpoint verifies token validity <br>
Users can only access their own data <br>

### Authentication Flow:
User registers <br>
Password is hashed and stored in database <br>
User logs in <br>
JWT token is generated <br>
Token is attached to protected requests <br>
Backend validates token before processing <br>

## Transaction Management Engine
This module handles financial operations.

### Transaction Structure:
amount (positive = income, negative = expense) <br>
category <br>
description <br>
date <br>

### Functional Capabilities:
Create new transaction <br>
Retrieve transaction list <br>
Filter transactions by category <br>
Delete specific transaction (ownership verified) <br>

## Currency Analytics Module
This module provides real-time currency information and simple exchange rate analysis. <br>

### Provides:
🇺🇸 Current USD exchange rate <br>
🇪🇺 Current EUR exchange rate <br>
🇬🇧 Current GBP exchange rate <br>
🇨🇦 Current CAD exchange rate <br>
🇵🇱 Current PLN exchange rate <br>
🇨🇿 Current CZK exchange rate <br>
🇯🇵 Current JPY exchange rate <br>
Automatically updated currency data from https://api.exchangerate-api.com/v4/latest/UAH <br>
and alternative https://open.er-api.com/v6/latest/UAH <br>
Short-term (10 day) exchange rate statistics. <br>

## Team
**[Zavada Sofiia](https://github.com/Zavada-Sofiia)**<br>
↳ <br>
↳ README <br>

**[Zuzuk Polina](https://github.com/pollinariaws)**<br>
↳ Idea of the project<br>
↳ Adaptive design<br>
↳ Live currency tracker<br>

**[Shlapak Olesia](https://github.com/shlapakolesia)**<br>
↳ Frontend development, ui/ux design<br>
↳ Implementing the connection between Wishlist and Tracker<br>
↳ README <br>
↳ Presentation

**[Denysova Mariia](https://github.com/oryavchik)**<br>
↳ Frontend design, ui/ux design<br>
↳ README <br>
↳ Presentation

Mentor: **[Shymanovskiy Vladislav](https://github.com/VlaDisLav23232)**
