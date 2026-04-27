from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
import logging

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

        new_user = User(
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token({"sub": new_user.username, "user_id": new_user.id})
        return TokenResponse(access_token=token, message="Registration successful")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.username == payload.username).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        token = create_access_token({"sub": user.username, "user_id": user.id})
        return TokenResponse(access_token=token, message="Login successful")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
