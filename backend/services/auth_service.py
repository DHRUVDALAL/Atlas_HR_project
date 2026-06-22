from sqlalchemy.orm import Session
from models.user import User
from utils.password_handler import verify_password
from utils.jwt_handler import encode_jwt
from datetime import datetime, timedelta
import os

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def update_last_login(db: Session, user_id: str):
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
    return user

def create_access_token_for_user(user: User, expires_delta: timedelta = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {
        "user_id": str(user.user_id),
        "email": user.email,
        "role": user.role.role_name,
        "exp": expire
    }
    secret_key = os.getenv("SECRET_KEY")
    algorithm = os.getenv("ALGORITHM")
    return encode_jwt(to_encode, secret_key, algorithm)