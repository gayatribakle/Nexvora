from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime

from app.database.session import get_db
from app.database.models import User, Worker, SystemLog
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.auth.dependencies import get_current_user, require_admin
from app.auth.schemas import (
    LoginRequest, TokenResponse, UserCreate, UserUpdate, UserResponse,
    WorkerCreate, WorkerResponse, WorkerDetailResponse, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    user.last_login = datetime.datetime.utcnow()
    db.commit()

    token = create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.id})

    log = SystemLog(
        action="login",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
        details=f"User {user.username} logged in",
    )
    db.add(log)
    db.commit()

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log = SystemLog(
        action="create_user",
        entity_type="user",
        entity_id=user.id,
        user_id=current_user.id,
        details=f"Created user {user.username}",
    )
    db.add(log)
    db.commit()

    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email is not None:
        user.email = data.email
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password reset token to the user's email."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.is_active:
        # Do not reveal whether the email exists for security
        return {"message": "If the email exists, a reset link has been sent"}

    # Generate reset token
    import secrets
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    db.commit()

    # Send reset email
    try:
        from app.services.email_service import email_service
        from app.config.settings import settings
        reset_url = f"{settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else 'http://localhost:3000'}/reset-password?token={token}"
        email_service.send_email(
            to_emails=[user.email],
            subject="[Safety Monitor] Password Reset Request",
            body=f"You have requested a password reset. Please use the following link to reset your password: {reset_url}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.",
            html_body=f"""
<html><body>
<h2 style="color: #1a237e;">Password Reset Request</h2>
<p>You have requested a password reset for your Safety Monitor account.</p>
<p><a href="{reset_url}" style="background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
<p>This link expires in <strong>1 hour</strong>.</p>
<p>If you did not request this, please ignore this email.</p>
</body></html>
""",
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send reset email: {e}")

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using the token from forgot-password email."""
    user = db.query(User).filter(User.password_reset_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if not user.password_reset_expires or user.password_reset_expires < datetime.datetime.utcnow():
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = get_password_hash(data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "Password reset successfully"}
