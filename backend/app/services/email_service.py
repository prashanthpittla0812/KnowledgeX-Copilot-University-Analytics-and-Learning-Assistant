import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List

def get_mail_config():
    return ConnectionConfig(
        MAIL_USERNAME=os.environ.get("MAIL_USERNAME", "dummy"),
        MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD", "dummy"),
        MAIL_FROM=os.environ.get("MAIL_FROM", "dummy@example.com"),
        MAIL_PORT=int(os.environ.get("MAIL_PORT", 587)),
        MAIL_SERVER=os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )

async def send_otp_email(email: str, otp: str, purpose: str = "Login"):
    fast_mail = FastMail(get_mail_config())
    html = f"""
    <h2>KnowledgeX Copilot Verification</h2>
    <p>Your OTP for {purpose} is: <strong style="font-size: 24px;">{otp}</strong></p>
    <p>This OTP will expire in 5 minutes. Please do not share it with anyone.</p>
    """
    
    message = MessageSchema(
        subject=f"Your {purpose} OTP - KnowledgeX Copilot",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    # Print to console for easy testing without email configuration
    print(f"\n{'='*50}\n[DEV] OTP for {email} ({purpose}): {otp}\n{'='*50}\n")
    
    try:
        await fast_mail.send_message(message)
    except Exception as e:
        print(f"Failed to send email (check .env configuration): {e}")

async def send_login_notification(email: str, name: str, time_str: str, device: str, browser: str, os_str: str, ip: str):
    fast_mail = FastMail(get_mail_config())
    html = f"""
    <p>Hello {name},</p>
    <p>A new login was detected on your KnowledgeX Copilot account.</p>
    <p><strong>Time:</strong><br>{time_str}</p>
    <p><strong>Device:</strong><br>{device}</p>
    <p><strong>Browser:</strong><br>{browser}</p>
    <p><strong>Operating System:</strong><br>{os_str}</p>
    <p><strong>IP Address:</strong><br>{ip}</p>
    <br>
    <p>If this activity was not performed by you, please reset your password immediately.</p>
    <p>Regards,<br>KnowledgeX Security Team</p>
    """
    
    message = MessageSchema(
        subject="New Login Detected - KnowledgeX Copilot",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    try:
        await fast_mail.send_message(message)
    except Exception as e:
        print(f"Failed to send email: {e}")

async def send_approval_email(email: str, name: str):
    fast_mail = FastMail(get_mail_config())
    html = f"""
    <h2>KnowledgeX Copilot Account Approved</h2>
    <p>Hello {name},</p>
    <p>Great news! Your account has been reviewed and <strong>approved</strong> by an administrator.</p>
    <p>You can now log in to the KnowledgeX Copilot platform using your registered email and password.</p>
    <br>
    <p>Welcome aboard!</p>
    <p>Regards,<br>KnowledgeX Admin Team</p>
    """
    
    message = MessageSchema(
        subject="Your Account is Approved - KnowledgeX Copilot",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    print(f"\n{'='*50}\n[DEV] Approval Email sent to {email}\n{'='*50}\n")
    
    try:
        await fast_mail.send_message(message)
    except Exception as e:
        print(f"Failed to send email: {e}")
