import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitSupportRequest(
    @Request() req,
    @Body() createSupportDto: CreateSupportDto,
  ) {
    return this.supportService.submitSupportRequest(req.user, createSupportDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('admin')
  async getAllMessages() {
    return this.supportService.getAllSupportMessages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch('admin/:id/resolve')
  async resolveMessage(@Param('id') id: string) {
    return this.supportService.resolveMessage(id);
  }
}
