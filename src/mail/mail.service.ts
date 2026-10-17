import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendPasswordResetCode(email: string, code: string) {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured. Password reset code for ${email}: ${code}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@sakan.app',
      to: email,
      subject: 'Password Reset Code - Sakan',
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
  }
  async sendSupportEmail(
    userEmail: string,
    userName: string,
    subject: string,
    message: string,
    adminEmail: string,
  ) {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured. Support message from ${userEmail}: ${message}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@sakan.app',
      to: adminEmail,
      subject: `[Support Request] ${subject}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${userName} (${userEmail})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });
  }
}
