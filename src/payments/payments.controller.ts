import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';

import { PaymentsService } from './payments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

type AuthenticatedRequest = ExpressRequest & {
  user: { userId: string };
};

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('receipt'))
  create(
    @Body() dto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.paymentsService.create(dto, req.user.userId, file);
  }

  @Get('my')
  myPayments(@Req() req: AuthenticatedRequest) {
    return this.paymentsService.myPayments(req.user.userId);
  }

  @Get('admin')
  @Roles('Admin')
  adminPayments(@Query('status') status?: string) {
    return this.paymentsService.adminPayments(status);
  }

  @Patch(':id/approve')
  @Roles('Admin')
  approve(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.approve(id, req.user.userId, dto.reviewNote);
  }

  @Patch(':id/reject')
  @Roles('Admin')
  reject(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.reject(id, req.user.userId, dto.reviewNote);
  }

  @Get('methods')
  getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }
}
