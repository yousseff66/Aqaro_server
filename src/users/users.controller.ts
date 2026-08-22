import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { FcmTokenDto, RemoveFcmTokenDto } from './dto/fcm-token.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Patch('me/phone')
  @UseGuards(JwtAuthGuard)
  async changePhone(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePhoneDto,
  ) {
    const existing = await this.usersService.findByPhone(dto.phone);

    if (existing && existing._id.toString() !== user.userId) {
      throw new BadRequestException('Phone number already in use');
    }

    return this.usersService.updatePhone(user.userId, dto.phone);
  }

  @Patch('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  async registerFcmToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: FcmTokenDto,
  ) {
    await this.usersService.addFcmToken(
      user.userId,
      dto.token,
      dto.platform,
      dto.deviceId,
    );

    return { message: 'FCM token registered' };
  }

  @Delete('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  async removeFcmToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: RemoveFcmTokenDto,
  ) {
    await this.usersService.removeFcmToken(user.userId, dto.token);
    return { message: 'FCM token removed' };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: { userId: string }) {
    await this.usersService.deleteUser(user.userId);
    return { message: 'Account deleted successfully' };
  }
}
