from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database

class TokenData(BaseModel):
    username: Optional[str] = None

# CONFIG
SECRET_KEY = "MALI_CHAT_SUPER_SECRET_KEY_CHANGE_ME" # In production, use os.getenv
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Hours

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Debugging Token
        # print(f"DEBUG AUTH: Received Token: {token[:10]}...") 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub") # access_token 'sub' holding the email
        # print(f"DEBUG AUTH: Decoded sub: {username}")

        if username is None:
            print("DEBUG AUTH: Missing 'sub' (username/email) in token")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print(f"DEBUG AUTH: JWT Verification Failed: {e}")
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == token_data.username).first() # Query by EMAIL
    if user is None:
        print(f"DEBUG AUTH: User not found in DB for email: {token_data.username}")
        raise credentials_exception
    return user

async def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        print(f"DEBUG AUTH: Access Denied. User {current_user.email} (Role: {current_user.role}) is NOT admin.")
        raise HTTPException(status_code=403, detail="Not an admin")
    return current_user
