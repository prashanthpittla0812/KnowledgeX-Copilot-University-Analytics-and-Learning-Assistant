from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
from app.schemas.user_schema import UserUpdateRequest

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

        from datetime import datetime
        now = datetime.utcnow()
        if user.last_login_date:
            delta = now.date() - user.last_login_date.date()
            if delta.days == 1:
                user.current_streak += 1
            elif delta.days > 1:
                user.current_streak = 1
        else:
            user.current_streak = 1

        user.last_login_date = now
        await db.commit()

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


@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update current user profile details",
)
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if request.name is not None:
        name_val = request.name.strip()
        if not name_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty",
            )
        current_user.name = name_val
    if request.department is not None:
        current_user.department = request.department.strip() or None
    if request.designation is not None:
        current_user.designation = request.designation.strip() or None

    # Audit log
    from app.database.models import AuditLog
    from datetime import datetime
    log = AuditLog(
        action="update_profile",
        performed_by=current_user.id,
        target_user=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post(
    "/profile/photo",
    summary="Upload profile photo for current user",
)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    import os
    import uuid
    import aiofiles
    from pathlib import Path
    from app.config.settings import settings

    photo_dir = settings.UPLOAD_PATH / "profile_photos"
    photo_dir.mkdir(parents=True, exist_ok=True)

    file_extension = Path(file.filename).suffix or ".jpg"
    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex}{file_extension}"
    file_path = photo_dir / unique_filename

    # Delete old profile photo if it exists
    if current_user.profile_photo_path:
        try:
            relative_stored = current_user.profile_photo_path
            if relative_stored.startswith("uploads/"):
                old_file = settings.UPLOAD_PATH.parent / relative_stored
                if old_file.exists():
                    old_file.unlink()
        except Exception:
            pass

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    relative_path = f"uploads/profile_photos/{unique_filename}"
    current_user.profile_photo_path = relative_path

    # Audit log
    from app.database.models import AuditLog
    from datetime import datetime
    log = AuditLog(
        action="update_profile_photo",
        performed_by=current_user.id,
        target_user=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    await db.commit()

    return {
        "message": "Profile photo uploaded successfully",
        "profile_photo_path": relative_path,
    }


@router.delete(
    "/profile/photo",
    summary="Remove profile photo for current user",
)
async def remove_profile_photo(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.profile_photo_path:
        try:
            from pathlib import Path
            from app.config.settings import settings
            relative_stored = current_user.profile_photo_path
            if relative_stored.startswith("uploads/"):
                old_file = settings.UPLOAD_PATH.parent / relative_stored
                if old_file.exists():
                    old_file.unlink()
        except Exception:
            pass

    current_user.profile_photo_path = None

    # Audit log
    from app.database.models import AuditLog
    from datetime import datetime
    log = AuditLog(
        action="remove_profile_photo",
        performed_by=current_user.id,
        target_user=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    await db.commit()

    return {"message": "Profile photo removed successfully"}

