import os
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.user import User, RefreshToken
from utils.password_handler import verify_password
from utils.jwt_handler import encode_jwt

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_token(raw_token: str) -> str:
    """Refresh tokens are stored only as SHA-256 hashes, so a leaked DB row
    cannot be replayed as a valid session."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print("User does not exist")
        return False

    print(f"Bcrypt hash: {user.password}")
    is_valid = verify_password(password, user.password)
    print(f"verify_password() returned: {is_valid}")

    now = _now()
    if user.locked_until and user.locked_until > now:
        remaining_mins = max(1, int((user.locked_until - now).total_seconds() / 60.0))
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Account is temporarily locked due to too many failed login "
                f"attempts. Try again in {remaining_mins} minutes."
            ),
        )

    if not is_valid:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        return False

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account"
        )

    # Success — reset the lockout counters.
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return user


def update_last_login(db: Session, user_id: str):
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    user = db.query(User).filter(User.user_id == uid).first()
    if user:
        user.last_login = _now()
        db.commit()
        db.refresh(user)
    return user


def _secret_and_algorithm() -> tuple:
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise ValueError("SECRET_KEY must be set in environment")
    return secret_key, os.getenv("ALGORITHM", "HS256")


def create_access_token_for_user(user: User, expires_delta: timedelta = None):
    expire = _now() + (expires_delta or timedelta(minutes=15))
    to_encode = {
        "user_id": str(user.user_id),
        "email": user.email,
        "role": user.role.role_name,
        "exp": expire,
    }
    secret_key, algorithm = _secret_and_algorithm()
    return encode_jwt(to_encode, secret_key, algorithm)


def create_refresh_token(db: Session, user_id: str) -> str:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    raw_token = secrets.token_urlsafe(48)
    db_token = RefreshToken(
        user_id=uid,
        token_hash=_hash_token(raw_token),
        expires_at=_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False,
    )
    db.add(db_token)
    db.commit()
    # Return the RAW token to the client; only its hash is persisted.
    return raw_token


def _active_token_row(db: Session, raw_token: str) -> RefreshToken:
    return db.query(RefreshToken).filter(
        RefreshToken.token_hash == _hash_token(raw_token),
        RefreshToken.is_revoked == False,  # noqa: E712
        RefreshToken.expires_at > _now(),
    ).first()


def verify_refresh_token(db: Session, token: str) -> User:
    db_token = _active_token_row(db, token)
    return db_token.user if db_token else None


def revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """Revoke a single refresh token (logout of one session)."""
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == _hash_token(raw_token),
        RefreshToken.is_revoked == False,  # noqa: E712
    ).first()
    if not db_token:
        return False
    db_token.is_revoked = True
    db_token.revoked_at = _now()
    db.commit()
    return True


def rotate_refresh_token(db: Session, old_token: str) -> tuple:
    db_token = _active_token_row(db, old_token)
    if not db_token:
        return None

    user = db_token.user

    # Rotate: revoke the presented token, issue a fresh pair.
    db_token.is_revoked = True
    db_token.revoked_at = _now()
    db.commit()

    new_refresh = create_refresh_token(db, str(user.user_id))
    access_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    new_access = create_access_token_for_user(
        user, expires_delta=timedelta(minutes=access_minutes)
    )
    return new_access, new_refresh, user
