from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)


    goals = relationship("Goal", back_populates="owner")
    wishlist_items = relationship("WishlistItem", back_populates="owner")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    target_amount = Column(Float)
    monthly_contribution = Column(Float)
    current_savings = Column(Float, default=0.0)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="goals")

class WishlistItem(Base):
    __tablename__ = "wishlist"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    priority = Column(Integer)
    is_bought = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="wishlist_items")
