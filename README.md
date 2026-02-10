# 📊 Finance Tracker API
This project is a modern RESTful API for personal finance tracking, built with FastAPI and SQLModel. It allows users to manage their income and expenses securely using JWT authentication.

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
Language: Python 3.10+, HTML
Framework: FastAPI
Database (ORM): SQLModel (SQLAlchemy + Pydantic)
Database Engine: SQLite
Authentication: PyJWT, OAuth2PasswordBearer

### 📁 Project Structure
