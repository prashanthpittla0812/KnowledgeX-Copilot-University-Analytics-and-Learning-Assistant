import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from user_agents import parse

from app.auth.auth import AuthService, InactiveAccountError, UnapprovedAccountError
from app.auth.dependencies import get_current_user
from app.auth.password import hash_password
from app.database.db import get_db
from app.database.models import User, OTPVerification, LoginAudit, AuditLog, EmailVerificationOTP
from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    ChangePasswordRequest,
    LoginOtpResponse,
    VerifyOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SendRegistrationOtpRequest,
    VerifyRegistrationOtpRequest
)
from app.services.email_service import send_otp_email, send_login_notification, send_registration_otp_email
from app.schemas.user_schema import UserUpdateRequest
router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

@router.put("/change-password", summary="Change current user password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.auth.password import verify_password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.password_hash = hash_password(request.new_password)
    current_user.must_change_password = False
    
    log = AuditLog(
        action="change_password",
        performed_by=current_user.id,
        target_user=current_user.id,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    
    await db.commit()
    return {"message": "Password updated successfully"}


@router.post("/send-registration-otp", summary="Send OTP for registration verification")
async def send_registration_otp(request: SendRegistrationOtpRequest, db: AsyncSession = Depends(get_db)):
    # Check if email is already registered and verified
    user_res = await db.execute(select(User).where(User.email == request.email))
    existing_user = user_res.scalar_one_or_none()
    if existing_user and existing_user.email_verified:
        raise HTTPException(status_code=400, detail="Email Already Registered")

    # Check for rate limiting / recent OTP
    recent_otp_res = await db.execute(
        select(EmailVerificationOTP).where(
            EmailVerificationOTP.email == request.email,
            EmailVerificationOTP.created_at > datetime.utcnow() - timedelta(seconds=60)
        )
    )
    if recent_otp_res.scalar_one_or_none():
        raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting another OTP.")

    otp = generate_otp()
    from app.auth.password import hash_password
    hashed_otp = hash_password(otp)

    verification = EmailVerificationOTP(
        email=request.email,
        otp_code=hashed_otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(verification)
    await db.commit()

    await send_registration_otp_email(request.email, otp)
    return {"message": "OTP sent successfully"}


@router.post("/verify-registration-otp", summary="Verify registration OTP")
async def verify_registration_otp(request: VerifyRegistrationOtpRequest, db: AsyncSession = Depends(get_db)):
    otp_res = await db.execute(
        select(EmailVerificationOTP)
        .where(EmailVerificationOTP.email == request.email)
        .order_by(EmailVerificationOTP.created_at.desc())
    )
    otp_record = otp_res.scalars().first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found for this email.")

    if otp_record.is_verified:
        return {"verified": True}

    if otp_record.attempts >= 5:
        raise HTTPException(status_code=400, detail="Too Many Attempts. Please request a new OTP.")

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP Expired")

    from app.auth.password import verify_password
    if not verify_password(request.otp, otp_record.otp_code):
        otp_record.attempts += 1
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_record.is_verified = True
    await db.commit()
    return {"verified": True}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Verify OTP first
    otp_res = await db.execute(
        select(EmailVerificationOTP)
        .where(
            EmailVerificationOTP.email == request.email,
            EmailVerificationOTP.is_verified == True
        )
        .order_by(EmailVerificationOTP.created_at.desc())
    )
    verified_otp = otp_res.scalars().first()
    
    if not verified_otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email verification required")

    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user(
            name=request.name,
            email=request.email,
            password=request.password,
            role=request.role,
        )
        user.email_verified = True
        user.verified_at = datetime.utcnow()
        await db.commit()
        
        token = auth_service.generate_token(user)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", summary="Validate credentials and return JWT", response_model=TokenResponse)
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_user(
            email=request.email,
            password=request.password,
        )

        if not getattr(user, 'email_verified', False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before logging in.")

        from datetime import datetime
        if user.role == "student":
            from app.utils.streak import update_user_streak
            await update_user_streak(user, db)
        else:
            user.last_login_date = datetime.utcnow()
            await db.commit()

        token = auth_service.generate_token(user)
        return TokenResponse(access_token=token, must_change_password=user.must_change_password)
        
    except UnapprovedAccountError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InactiveAccountError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/verify-login-otp", response_model=TokenResponse)
async def verify_login_otp(request: VerifyOtpRequest, req: Request, db: AsyncSession = Depends(get_db)):
    user_res = await db.execute(select(User).where(User.email == request.email))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp_res = await db.execute(
        select(OTPVerification).where(
            OTPVerification.user_id == user.id,
            OTPVerification.otp_code == request.otp_code,
            OTPVerification.purpose == "LOGIN",
            OTPVerification.is_verified == False,
            OTPVerification.expires_at > datetime.utcnow()
        )
    )
    otp_record = otp_res.scalar_one_or_none()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    otp_record.is_verified = True
    
    # Update user streak
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
    
    # Device detection and Audit Logging
    user_agent_str = req.headers.get("user-agent", "")
    ua = parse(user_agent_str)
    browser = f"{ua.browser.family} {ua.browser.version_string}"
    operating_system = f"{ua.os.family} {ua.os.version_string}"
    device_type = "Mobile" if ua.is_mobile else "Tablet" if ua.is_tablet else "Desktop" if ua.is_pc else "Unknown"
    
    x_forwarded = req.headers.get("x-forwarded-for")
    ip_address = x_forwarded.split(",")[0] if x_forwarded else req.client.host
    
    audit = LoginAudit(
        user_id=user.id,
        login_time=now,
        browser=browser,
        operating_system=operating_system,
        device_type=device_type,
        ip_address=ip_address
    )
    db.add(audit)
    
    await db.commit()
    
    # Send login notification email
    await send_login_notification(
        email=user.email,
        name=user.name,
        time_str=now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        device=device_type,
        browser=browser,
        os_str=operating_system,
        ip=ip_address
    )
    
    auth_service = AuthService(db)
    token = auth_service.generate_token(user)
    return TokenResponse(access_token=token, must_change_password=user.must_change_password)


@router.post("/forgot-password", summary="Generate OTP for password reset")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_res = await db.execute(select(User).where(User.email == request.email))
    user = user_res.scalar_one_or_none()
    if not user:
        # Don't reveal if user exists or not
        return {"message": "If that email is registered, an OTP has been sent."}
        
    otp = generate_otp()
    verification = OTPVerification(
        user_id=user.id,
        otp_code=otp,
        purpose="PASSWORD_RESET",
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(verification)
    await db.commit()
    
    await send_otp_email(user.email, otp, purpose="Password Reset")
    return {"message": "If that email is registered, an OTP has been sent."}


@router.post("/verify-reset-otp", summary="Verify OTP for password reset")
async def verify_reset_otp(request: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    user_res = await db.execute(select(User).where(User.email == request.email))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or OTP")
        
    otp_res = await db.execute(
        select(OTPVerification).where(
            OTPVerification.user_id == user.id,
            OTPVerification.otp_code == request.otp_code,
            OTPVerification.purpose == "PASSWORD_RESET",
            OTPVerification.is_verified == False,
            OTPVerification.expires_at > datetime.utcnow()
        )
    )
    otp_record = otp_res.scalar_one_or_none()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    otp_record.is_verified = True
    await db.commit()
    
    return {"message": "OTP verified successfully"}


@router.post("/reset-password", summary="Set new password via OTP")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_res = await db.execute(select(User).where(User.email == request.email))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    # Check if there is a verified OTP for this purpose within a reasonable timeframe (e.g., 15 mins)
    otp_res = await db.execute(
        select(OTPVerification).where(
            OTPVerification.user_id == user.id,
            OTPVerification.otp_code == request.otp_code,
            OTPVerification.purpose == "PASSWORD_RESET",
            OTPVerification.is_verified == True,
            OTPVerification.expires_at > datetime.utcnow() - timedelta(minutes=10)
        )
    )
    otp_record = otp_res.scalar_one_or_none()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP verification")
    
    user.password_hash = hash_password(request.new_password)
    user.must_change_password = False
    # delete or invalidate the OTP record if you want
    await db.delete(otp_record)
    await db.commit()
    
    return {"message": "Password has been reset successfully"}


@router.post("/logout", summary="Logout user")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/profile", response_model=UserResponse, summary="Get current authenticated user")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me", response_model=UserResponse, summary="Get current authenticated user (legacy)")
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
    # Allowed MIME types
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a valid image (JPEG, PNG, WebP).",
        )

    # Validate file size (max 5 MB)
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit.",
        )

    import uuid
    from pathlib import Path
    from app.services.supabase_storage import SupabaseStorageService
    from app.config.settings import settings

    file_extension = Path(file.filename).suffix or ".jpg"
    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex}{file_extension}"

    # Delete old profile photo from local storage OR Supabase if it exists
    if current_user.profile_photo_path:
        try:
            relative_stored = current_user.profile_photo_path
            if relative_stored.startswith("uploads/"):
                old_file = settings.UPLOAD_PATH.parent / relative_stored
                if old_file.exists():
                    old_file.unlink()
            elif "supabase.co" in relative_stored:
                # Extract filename from Supabase URL
                old_filename = relative_stored.split("/")[-1]
                await SupabaseStorageService.delete_file(old_filename)
        except Exception:
            pass

    # Try to upload to Supabase if configured, otherwise fallback to local
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        public_url = await SupabaseStorageService.upload_file(content, unique_filename, file.content_type)
        if not public_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image to storage service.",
            )
        current_user.profile_photo_path = public_url
    else:
        # Local Fallback
        profile_photos_dir = settings.UPLOAD_PATH / "profile_photos"
        profile_photos_dir.mkdir(parents=True, exist_ok=True)
        file_path = profile_photos_dir / unique_filename
        with open(file_path, "wb") as f:
            f.write(content)
        current_user.profile_photo_path = f"uploads/profile_photos/{unique_filename}"

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
        "success": True,
        "message": "Profile photo uploaded successfully",
        "profile_photo_path": public_url,
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
            from app.services.supabase_storage import SupabaseStorageService
            relative_stored = current_user.profile_photo_path
            
            if relative_stored.startswith("uploads/"):
                old_file = settings.UPLOAD_PATH.parent / relative_stored
                if old_file.exists():
                    old_file.unlink()
            elif "supabase.co" in relative_stored:
                # Extract filename from Supabase URL
                old_filename = relative_stored.split("/")[-1]
                await SupabaseStorageService.delete_file(old_filename)
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

