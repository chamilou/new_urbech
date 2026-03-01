from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
from app.core.env import load_project_env

load_project_env()

logger = logging.getLogger(__name__)

# ============================
# EMAIL CONFIG (USE ENV VARS)
# ============================
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)


def send_verification_email(email: str, name: str, code: str):
    """
    Send verification email with a 6-digit code.
    This function is synchronous on purpose (used with BackgroundTasks).
    """
    try:
        subject = "Verify Your Email Address"

        html_content = f"""
        <html>
        <body>
            <h2>Hello {name},</h2>
            <p>Thank you for registering!</p>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing: 4px;">{code}</h1>
            <p>Please enter this code in the app to verify your email.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <br>
            <p>Best regards,<br>Your App Team</p>
        </body>
        </html>
        """

        text_content = f"""
        Hello {name},

        Thank you for registering!

        Your verification code is: {code}

        Enter this code in the app to verify your email.

        If you didn't create an account, you can safely ignore this email.

        Best regards,
        Your App Team
        """

        send_email(
            to_email=email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

        logger.info(f"Verification email sent to {email}")

    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        # DO NOT raise — registration must not fail because of email


def send_password_reset_email(email: str, name: str, reset_link: str, expires_minutes: int = 30):
    """
    Send password reset email with link.
    """
    try:
        subject = "Reset Your Password"

        html_content = f"""
        <html>
        <body>
            <h2>Hello {name or 'there'},</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the link below to choose a new password (expires in {expires_minutes} minutes):</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you didn't request this, you can ignore this email.</p>
            <br>
            <p>Best regards,<br>Your App Team</p>
        </body>
        </html>
        """

        text_content = f"""
        Hello {name or 'there'},

        We received a request to reset your password.
        Use the link below to choose a new password (expires in {expires_minutes} minutes):
        {reset_link}

        If you didn't request this, you can ignore this email.

        Best regards,
        Your App Team
        """

        send_email(
            to_email=email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

        logger.info(f"Password reset email sent to {email}")

    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        # Do not raise; endpoint should remain silent

def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        logger.info(
            f"SMTP connect: server={SMTP_SERVER} port={SMTP_PORT} "
            f"user={'SET' if SMTP_USERNAME else 'EMPTY'} pass={'SET' if SMTP_PASSWORD else 'EMPTY'} from={FROM_EMAIL}"
        )

        # ✅ Use SSL for 465, STARTTLS for 587
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)

        logger.info(f"Email sent to {to_email}")

    except Exception as e:
        logger.error(f"SMTP error sending email to {to_email}: {str(e)}")
        raise
