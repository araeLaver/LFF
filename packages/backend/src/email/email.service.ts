import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM', 'LFF <noreply@lff.com>'),
      to: email,
      subject: 'Verify your LFF account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to LFF</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px;">Verify your email address</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Thank you for signing up! Please click the button below to verify your email address and activate your account.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <a href="${verificationUrl}"
                         style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">
                  This link will expire in 24 hours.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} LFF. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM', 'LFF <noreply@lff.com>'),
      to: email,
      subject: 'Reset your LFF password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">LFF</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px;">Reset your password</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  We received a request to reset your password. Click the button below to create a new password.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <a href="${resetUrl}"
                         style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                  If you didn't request a password reset, you can safely ignore this email.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">
                  This link will expire in 1 hour.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} LFF. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }
}
