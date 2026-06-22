from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserCreate, User
from app.schemas.auth import LoginRequest, Token
from app.models.user import User as UserModel
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=User)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserModel(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return User(id=user.id, email=user.email, is_active=user.is_active)


@router.post("/token", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return Token(access_token=token)
