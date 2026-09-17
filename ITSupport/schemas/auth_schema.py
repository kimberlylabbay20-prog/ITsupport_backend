"""Pydantic schemas for authentication (registration and login).

JWT issuance/verification is not implemented yet; only the request
and response shapes are defined.
"""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from schemas.user_schema import UserResponse


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse