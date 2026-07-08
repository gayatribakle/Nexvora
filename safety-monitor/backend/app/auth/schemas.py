from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import datetime


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4, max_length=100)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_superuser: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100, pattern="^[a-zA-Z0-9_]+$")
    email: str = Field(..., max_length=200)
    password: str = Field(..., min_length=4, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=200)
    role: str = Field(default="worker", pattern="^(admin|worker|supervisor|safety_officer)$")


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class WorkerCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100, pattern="^[a-zA-Z0-9_]+$")
    email: str = Field(..., max_length=200)
    password: str = Field(..., min_length=4, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=200)
    employee_id: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    contractor: Optional[str] = None
    role: str = Field(default="worker", pattern="^(admin|worker|supervisor|safety_officer)$")


class WorkerResponse(BaseModel):
    id: int
    user_id: int
    employee_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    safety_score: int
    total_violations: int
    total_fines: int
    total_fine_amount: float
    trainings_completed: int
    quizzes_passed: int
    is_active: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class WorkerDetailResponse(WorkerResponse):
    user: Optional[UserResponse] = None
    images: list = []


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=4, max_length=100)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., max_length=200)

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=4, max_length=100)
