import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import type { Response } from 'express';
import PDFDocument from 'pdfkit';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PropertiesService } from '../properties/properties.service';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from '../users/users.service';
import { FavoritesService } from '../favorites/favorites.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { UpdatePlatformSettingsDto } from '../platform-settings/dto/update-platform-settings.dto';
import { PaymentsService } from '../payments/payments.service';
import { ReportsService } from '../reports/reports.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly usersService: UsersService,
    private readonly favoritesService: FavoritesService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly paymentsService: PaymentsService,
    private readonly reportsService: ReportsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get('test')
  @Roles('Admin')
  test() {
    return {
      message: 'Welcome Admin 👑',
    };
  }
  @Get('properties/pending')
@Roles('Admin')
getPendingProperties() {
  return this.propertiesService.getPendingProperties();
}
@Patch('properties/:id/status')
@Roles('Admin')
updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdatePropertyStatusDto,
) {
  return this.propertiesService.updatePropertyStatus(
    id,
    dto.status,
    dto.reviewNote,
  );
}
@Patch('properties/:id/feature')
@Roles('Admin')
toggleFeatured(
  @Param('id') id: string,
) {
  return this.propertiesService.toggleFeatured(id);
}
@Get('dashboard')
@Roles('Admin')
async dashboard(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const [
    propertyStats,
    totalUsers,
    totalAdmins,
    latestUsers,
    topCities,
    topViewed,
    latestProperties,
    paymentStats,
    activeReportsCount,
  ] = await Promise.all([
    this.propertiesService.getDashboardStats(start, end),
    this.usersService.countUsers(),
    this.usersService.countAdmins(),
    this.usersService.latestUsers(),
    this.propertiesService.getTopCities(),
    this.propertiesService.getTopViewed(),
    this.propertiesService.latestProperties(),
    this.paymentsService.getDashboardStats(start, end),
    this.reportsService.countActive(start, end),
  ]);

  return {
    users: {
      total: totalUsers,
      admins: totalAdmins,
      latest: latestUsers,
    },
    properties: propertyStats,
    payments: paymentStats,
    activeReports: activeReportsCount,
    topCities,
    topViewed,
    latestProperties,
  };
}

@Get('users')
@Roles('Admin')
getUsers(
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Query('search') search?: string,
) {
  return this.usersService.findAll(
    Number(page),
    Number(limit),
    search,
  );
}

@Post('notifications/push')
  @Roles('Admin')
  async sendPushNotification(@Body() dto: SendPushNotificationDto) {
    let tokens: string[] = [];

    if (dto.category === 'property_owners') {
      const ownerIds = await this.propertiesService.getOwnerIdsByStatus();
      tokens = await this.usersService.getTokensByIds(ownerIds);
    } else if (dto.category === 'pending_payment') {
      const ownerIds = await this.propertiesService.getOwnerIdsByStatus('PendingPayment');
      tokens = await this.usersService.getTokensByIds(ownerIds);
    } else {
      tokens = await this.usersService.getFcmTokensByCategory(dto.category);
    }

    const result = await this.pushNotificationService.sendToTokens(
      tokens,
      dto.title,
      dto.body,
    );

    return {
      message: `Push notification sent to ${result.successCount} devices`,
      ...result,
    };
  }

  @Get('settings')
@Roles('Admin')
getSettings() {
  return this.platformSettingsService.getSettings();
}

@Patch('settings')
@Roles('Admin')
updateSettings(
  @Body() dto: UpdatePlatformSettingsDto,
) {
  return this.platformSettingsService.update(dto);
}

@Delete('users/:id')
@Roles('Admin')
async deleteUser(
  @Param('id') id: string,
) {
  const user =
    await this.usersService.findById(id);

  if (!user) {
    throw new NotFoundException(
      'User not found',
    );
  }

  if (user.role === 'Admin') {
    const admins =
      await this.usersService.countAdmins();

    if (admins <= 1) {
      throw new BadRequestException(
        'Cannot delete the last admin',
      );
    }
  }

  // Delete all favorites
  await this.favoritesService.deleteUserFavorites(id);

  // Delete all properties + Cloudinary images
  await this.propertiesService.deleteAllUserProperties(id);

  // Delete user
  await this.usersService.deleteUser(id);

  await this.favoritesService.deletePropertyFavorites(id);

  return {
    message: 'User deleted successfully',
  };
}

@Patch('users/:id/role')
@Roles('Admin')
async updateUserRole(
  @Param('id') id: string,
  @Body() dto: UpdateUserRoleDto,
) {
  const user = await this.usersService.findById(id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.role === 'Admin' && dto.role === 'User') {
    const admins = await this.usersService.countAdmins();

    if (admins <= 1) {
      throw new BadRequestException(
        'Cannot change role of the last admin',
      );
    }
  }

  return this.usersService.updateRole(id, dto.role);
}

@Patch('users/:id/ban')
@Roles('Admin')
async toggleBanUser(
  @Param('id') id: string,
) {
  const user = await this.usersService.findById(id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.role === 'Admin' && !user.isBanned) {
    const admins = await this.usersService.countAdmins();

    if (admins <= 1) {
      throw new BadRequestException(
        'Cannot ban the last admin',
      );
    }
  }

  return this.usersService.toggleBan(id);
}

@Get('dashboard/export')
@Roles('Admin')
async exportDashboard(
  @Res() res: Response,
) {
  const [
    propertyStats,
    totalUsers,
    totalAdmins,
    latestUsers,
    topCities,
    topViewed,
    latestProperties,
  ] = await Promise.all([
    this.propertiesService.getDashboardStats(),
    this.usersService.countUsers(),
    this.usersService.countAdmins(),
    this.usersService.latestUsers(),
    this.propertiesService.getTopCities(),
    this.propertiesService.getTopViewed(),
    this.propertiesService.latestProperties(),
  ]);

  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
  });

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=Sakan_Dashboard_Report.pdf',
  );

  doc.pipe(res);

  // =========================
  // TITLE
  // =========================

  doc
    .fontSize(22)
    .text('Sakan Dashboard Report', {
      align: 'center',
    });

  doc.moveDown();

  doc
    .fontSize(10)
    .text(
      `Generated: ${new Date().toLocaleString()}`,
    );

  doc.moveDown();

  // =========================
  // USERS
  // =========================

  doc
    .fontSize(16)
    .text('Users');

  doc.fontSize(12);

  doc.text(`Total Users : ${totalUsers}`);
  doc.text(`Admins      : ${totalAdmins}`);

  doc.moveDown();

  doc.text('Latest Users');

  latestUsers.forEach((user: any) => {
    doc.text(
      `• ${user.name} (${user.email})`,
    );
  });

  doc.moveDown();

  // =========================
  // PROPERTIES
  // =========================

  doc
    .fontSize(16)
    .text('Properties');

  doc.fontSize(12);

  Object.entries(propertyStats).forEach(
    ([key, value]) => {
      doc.text(`${key}: ${value}`);
    },
  );

  doc.moveDown();

  // =========================
  // TOP CITIES
  // =========================

  doc
    .fontSize(16)
    .text('Top Cities');

  topCities.forEach((city: any) => {
    doc.text(
      `• ${city.city} (${city.count})`,
    );
  });

  doc.moveDown();

  // =========================
  // TOP VIEWED
  // =========================

  doc
    .fontSize(16)
    .text('Top Viewed Properties');

  topViewed.forEach((property: any) => {
    doc.text(
      `• ${property.title}
City: ${property.city}
Price: ${property.price}
Views: ${property.views}
Favorites: ${property.favoritesCount}`,
    );

    doc.moveDown();
  });

  // =========================
  // LATEST
  // =========================

  doc
    .fontSize(16)
    .text('Latest Properties');

  latestProperties.forEach((property: any) => {
    doc.text(
      `• ${property.title}
Owner: ${property.owner?.name}
Status: ${property.status}
Price: ${property.price}`,
    );

    doc.moveDown();
  });

  doc.end();
}
}