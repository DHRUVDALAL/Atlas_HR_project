import os
os.environ['DATABASE_URL'] = 'postgresql://dhruv@localhost:5432/postgres'
os.environ['SECRET_KEY'] = 'my_super_secret_key_123456'
os.environ['ALGORITHM'] = 'HS256'
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models.user import User
from models.role import Role
from utils.password_handler import verify_password

engine = create_engine(os.getenv('DATABASE_URL'))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    user = db.query(User).filter(User.email == 'admin@atlas.com').first()
    if user:
        print(f"Found user: {user.email}")
        print(f"Stored hash: {user.password}")
        print(f"Hash length: {len(user.password)}")
        password = 'password123'
        print(f"Password to check: {password}")
        print(f"Password length: {len(password)}")
        # Try to verify
        result = verify_password(password, user.password)
        print(f"Verify result: {result}")
    else:
        print("User not found")
finally:
    db.close()
