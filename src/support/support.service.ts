import { Injectable, BadRequestException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { CreateSupportDto } from './dto/create-support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly mailService: MailService,
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  async submitSupportRequest(user: any, createSupportDto: CreateSupportDto) {
    const settings = await this.platformSettingsService.getSettings();
    const adminEmail = settings.supportEmail;

    if (!adminEmail) {
      throw new BadRequestException('Support email is not configured by the administrator.');
    }

    await this.mailService.sendSupportEmail(
      user.email,
      user.name || 'User',
      createSupportDto.subject,
      createSupportDto.message,
      adminEmail,
    );

    return { success: true, message: 'Support request sent successfully.' };
  }
}
