from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os

def encode_jwt(data: dict, secret_key: str, algorithm: str, expires_delta: timedelta = None):
    to_encode = data.copy()
    if "exp" not in to_encode or expires_delta is not None:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt

def decode_jwt(token: str, secret_key: str, algorithm: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError:
        return None