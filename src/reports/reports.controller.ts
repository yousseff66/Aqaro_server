import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my')
  myReports(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.myReports(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get()
  adminReports(@Query('status') status?: string) {
    return this.reportsService.adminReports(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch(':id')
  review(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReviewReportDto,
  ) {
    return this.reportsService.review(id, user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.remove(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Delete('admin/:id')
  adminDelete(@Param('id') id: string) {
    return this.reportsService.adminDelete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Delete(':id/property')
  deleteReportedProperty(@Param('id') id: string) {
    return this.reportsService.deleteReportedProperty(id);
  }
}
