import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from user_agents import parse

from app.auth.auth import AuthService, InactiveAccountError, UnapprovedAccountError
from app.auth.dependencies import get_current_user
from app.auth.password import hash_password
from app.database.db import get_db
from app.database.models import User, OTPVerification, LoginAudit, AuditLog
from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    ChangePasswordRequest,
    LoginOtpResponse,
    VerifyOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.services.email_service import send_otp_email, send_login_notification

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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", summary="Validate credentials and return JWT", response_model=TokenResponse)
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_user(email=request.email, password=request.password)
        
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
            time_str=(now + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %I:%M %p IST"),
            device=device_type,
            browser=browser,
            os_str=operating_system,
            ip=ip_address
        )
        
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
