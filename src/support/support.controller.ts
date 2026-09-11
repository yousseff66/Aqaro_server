import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitSupportRequest(@Request() req, @Body() createSupportDto: CreateSupportDto) {
    return this.supportService.submitSupportRequest(req.user, createSupportDto);
  }
}
