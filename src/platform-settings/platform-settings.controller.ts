import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { PlatformSettingsService } from './platform-settings.service';

import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateSettings(
    @Body()
    dto: UpdatePlatformSettingsDto,
  ) {
    return this.settingsService.update(dto);
  }
}
