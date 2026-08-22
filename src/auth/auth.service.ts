import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email } = registerDto;
    const existingPhone = await this.usersService.findByPhone(
      registerDto.phone,
    );

    if (existingPhone) {
      throw new BadRequestException('Phone already exists');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      phone: registerDto.phone,
      role: 'User',
    });

    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        'Your account has been banned. Please contact support.',
      );
    }

    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (user) {
      const code = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15);

      await this.usersService.setResetCode(
        user._id.toString(),
        code,
        expires,
      );
      await this.mailService.sendPasswordResetCode(
        dto.email,
        code,
      );
    }

    return {
      message:
        'If this email exists, a reset code has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (
      !user ||
      !user.resetPasswordCode ||
      !user.resetPasswordExpires
    ) {
      throw new BadRequestException(
        'Invalid or expired reset code',
      );
    }

    if (
      user.resetPasswordCode !== dto.code ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException(
        'Invalid or expired reset code',
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      10,
    );
    await this.usersService.resetPassword(
      user._id.toString(),
      hashedPassword,
    );

    return { message: 'Password reset successfully' };
  }
}
