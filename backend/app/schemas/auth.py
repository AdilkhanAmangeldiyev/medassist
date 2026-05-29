from pydantic import BaseModel, EmailStr
from typing import Literal


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["patient", "doctor"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
