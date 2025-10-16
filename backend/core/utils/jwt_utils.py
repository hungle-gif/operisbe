"""
JWT utilities for authentication
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from typing import Dict, Any


def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_REFRESH_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")


def verify_token(token: str, token_type: str = 'access') -> str:
    """Verify token and return user_id"""
    payload = decode_token(token)
    
    if payload.get('type') != token_type:
        raise Exception(f"Invalid token type. Expected {token_type}")
    
    return payload.get('user_id')
