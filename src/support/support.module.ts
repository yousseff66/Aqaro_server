import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { MailModule } from '../mail/mail.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [MailModule, PlatformSettingsModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
