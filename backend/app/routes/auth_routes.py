from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import AuthService, InactiveAccountError, UnapprovedAccountError
from app.auth.dependencies import get_current_user
from app.database.db import get_db
from app.database.models import User
from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    ChangePasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.put("/change-password", summary="Change current user password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.auth.password import verify_password, hash_password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.password_hash = hash_password(request.new_password)
    current_user.must_change_password = False
    
    # Audit log
    from app.database.models import AuditLog
    from datetime import datetime
    log = AuditLog(
        action="change_password",
        performed_by=current_user.id,
        target_user=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    
    await db.commit()
    return {"message": "Password updated successfully"}


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user(
            name=request.name,
            email=request.email,
            password=request.password,
            role=request.role,
        )
        token = auth_service.generate_token(user)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email & password, receive JWT",
)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_user(
            email=request.email,
            password=request.password,
        )
        token = auth_service.generate_token(user)
        return TokenResponse(access_token=token, must_change_password=user.must_change_password)
    except UnapprovedAccountError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except InactiveAccountError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
