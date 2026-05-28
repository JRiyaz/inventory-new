import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..config import settings

logger = logging.getLogger("email-service")

# Central log file for local email logging fallback
LOGS_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EMAIL_LOG_PATH = os.path.join(LOGS_DIR, "app_emails.log")


class EmailService:
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str = "",
        user_settings=None,
    ) -> bool:
        """
        Configuration-driven email sender.
        Checks global .env EMAIL_ENABLED and user settings (UI toggle).
        Falls back to local file logging (app_emails.log) when SMTP details are unconfigured.
        """
        # 1. Global .env configuration check
        if not settings.EMAIL_ENABLED:
            logger.info(f"Email service disabled via global configuration for: {to_email}")
            return False

        # 2. User Settings (UI Toggle) check
        if user_settings:
            # Respect email_alerts toggle
            if hasattr(user_settings, "email_alerts") and not user_settings.email_alerts:
                logger.info(f"Email alerts toggled OFF in UI settings for user: {to_email}")
                return False
            # Respect Do Not Disturb (DND) toggle
            if hasattr(user_settings, "dnd") and user_settings.dnd:
                logger.info(f"Do Not Disturb active. Silencing email alerts for user: {to_email}")
                return False

        # 3. Check if we have active SMTP configuration
        smtp_configured = bool(settings.SMTP_HOST)

        if smtp_configured:
            try:
                # Construct MIME message
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.SMTP_SENDER
                msg["To"] = to_email

                # Attach plain text and HTML bodies
                part1 = MIMEText(text_content or "Please enable HTML view to read this alert.", "plain")
                part2 = MIMEText(html_content, "html")
                msg.attach(part1)
                msg.attach(part2)

                # Connect and send
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_SENDER, to_email, msg.as_string())

                logger.info(f"Real SMTP email successfully sent to {to_email} with subject: {subject}")
                return True
            except Exception as e:
                logger.error(f"Failed to send real SMTP email to {to_email}: {e}. Falling back to logging.")

        # 4. Fallback: Write beautiful formatted notification to app_emails.log
        try:
            border = "=" * 80
            email_entry = (
                f"\n{border}\n"
                f"TIMESTAMP:   [LOCAL LOG FALLBACK]\n"
                f"RECIPIENT:   {to_email}\n"
                f"SENDER:      {settings.SMTP_SENDER}\n"
                f"SUBJECT:     {subject}\n"
                f"{border}\n"
                f"TEXT BODY:\n{text_content or '(HTML Content Only)'}\n"
                f"{border}\n"
                f"HTML BODY:\n{html_content}\n"
                f"{border}\n"
            )
            with open(EMAIL_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(email_entry)

            # Print highlighted message to server console
            print(f"\n[EMAIL LOGGED] recipient={to_email} subject='{subject}' -> Written to app_emails.log")
            return True
        except Exception as e:
            logger.error(f"Failed to write to local email log: {e}")
            return False

    @classmethod
    def send_otp_email(cls, to_email: str, otp: str, user_settings=None) -> bool:
        """
        Sends the 6-digit Forgot Password verification OTP.
        """
        subject = f"{otp} is your Password Reset Verification Code"
        text = f"Hello,\n\nYou requested a password reset. Your verification code is: {otp}\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email."
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #6d74ff; margin-top: 0;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                    <div style="background-color: #f5f6ff; border: 1px dashed #6d74ff; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b429f;">{otp}</span>
                    </div>
                    <p style="color: #666; font-size: 12px;">This code is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email or secure your account.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 11px; color: #999; text-align: center;">Inventory Management System &copy; 2026</p>
                </div>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, html, text, user_settings)

    @classmethod
    def send_password_change_alert(cls, to_email: str, name: str, user_settings=None) -> bool:
        """
        Sends a security notification alert when the user's password is changed.
        """
        subject = "Security Alert: Password Updated"
        text = f"Hello {name},\n\nThis is a security alert to confirm that the password for your Inventory account was changed successfully.\n\nIf you did not perform this change, please contact support immediately to secure your account."
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #ff5b5b; margin-top: 0;">Security Alert: Password Changed</h2>
                    <p>Hello {name},</p>
                    <p>This email confirms that the password for your Inventory Management System profile has been <strong>successfully updated</strong>.</p>
                    <div style="background-color: #fff5f5; border: 1px solid #ffcccc; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #d9534f; font-size: 14px; font-weight: bold;">Did you make this change?</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">If you did not change your password, please contact the System Administrator or support team immediately.</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 11px; color: #999; text-align: center;">Inventory Management System Security &copy; 2026</p>
                </div>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, html, text, user_settings)

    @classmethod
    def send_profile_update_alert(cls, to_email: str, name: str, details: str, user_settings=None) -> bool:
        """
        Sends an alert when the user's profile details are updated.
        """
        subject = "Account Update: Profile Details Modified"
        text = f"Hello {name},\n\nYour profile details were recently updated in the Inventory Management System.\n\nDetails of updates:\n{details}\n\nIf you did not request this update, please contact the System Administrator."
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #3b429f; margin-top: 0;">Account Information Updated</h2>
                    <p>Hello {name},</p>
                    <p>The profile details associated with your account have been successfully modified.</p>
                    <div style="background-color: #f7f7f9; border-left: 4px solid #3b429f; padding: 15px; margin: 20px 0; font-family: monospace; white-space: pre-wrap; font-size: 13px;">
{details}
                    </div>
                    <p style="color: #666; font-size: 12px;">If you believe this change was made in error, please contact your administrator.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 11px; color: #999; text-align: center;">Inventory Management System &copy; 2026</p>
                </div>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, html, text, user_settings)
