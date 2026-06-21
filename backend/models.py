from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    nickname = Column(String, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user")  # 'admin' or 'user'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="owner")
    uploaded_files = relationship("UploadedFile", back_populates="owner")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)  # 'user', 'ai', 'system'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="messages")


class UploadedFile(Base):
    """Tracks files uploaded to Gemini File API for deep document understanding."""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = global
    filename = Column(String, index=True)
    original_filename = Column(String)
    gemini_file_uri = Column(String)   # e.g. "files/abc123"
    gemini_file_name = Column(String)  # display name in Gemini
    mime_type = Column(String)
    scope = Column(String, default="private")  # 'private' or 'global'
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="uploaded_files")
