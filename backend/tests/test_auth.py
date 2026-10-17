import pytest
from app.utils.security import hash_password, verify_password, create_access_token
import jwt
from app.config import settings

def test_password_hashing():
    pwd = "secretpassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_token_generation():
    payload = {"sub": "test@aihire.com", "role": "recruiter"}
    token = create_access_token(payload)
    assert token is not None

    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "test@aihire.com"
    assert decoded["role"] == "recruiter"
