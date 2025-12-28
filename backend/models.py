from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    nickname = Column(String, index=True)
    full_name = Column(String, nullable=True) # Added full_name as optional
    hashed_password = Column(String) # Renamed password_hash to hashed_password
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user") # 'admin' or 'user'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="owner")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String) # 'user', 'ai', 'system'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="messages")
