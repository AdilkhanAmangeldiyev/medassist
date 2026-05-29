from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.models.doctor import DoctorProfile
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse


def register(data: RegisterRequest, db: Session) -> TokenResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(name=data.name, email=data.email, hashed_password=hash_password(data.password), role=data.role)
    db.add(user)
    db.flush()

    if data.role == "doctor":
        db.add(DoctorProfile(user_id=user.id))

    db.commit()
    db.refresh(user)
    return _make_tokens(user)


def login(data: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _make_tokens(user)


def refresh(refresh_token: str, db: Session) -> TokenResponse:
    from jose import JWTError
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _make_tokens(user)


def _make_tokens(user: User) -> TokenResponse:
    payload = {"sub": str(user.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
    )
