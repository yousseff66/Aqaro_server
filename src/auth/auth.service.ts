import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { getAuth } from 'firebase-admin/auth';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordByPhoneDto } from './dto/reset-password-by-phone.dto';
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
    const existingPhone = await this.usersService.findByPhone(
      registerDto.phone,
    );

    if (existingPhone) {
      throw new BadRequestException('Phone already exists');
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(
        registerDto.firebaseIdToken,
      );
      const expectedPhone = registerDto.phone.startsWith('+2')
        ? registerDto.phone
        : `+2${registerDto.phone}`;
      if (decodedToken.phone_number !== expectedPhone) {
        throw new UnauthorizedException(
          'Phone number mismatch with Firebase OTP',
        );
      }
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || 'Invalid or expired Firebase OTP token',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      name: registerDto.name,
      password: hashedPassword,
      phone: registerDto.phone,
      role: 'User',
    });

    const token = this.jwtService.sign({
      sub: user._id.toString(),
      phone: user.phone,
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
    const { phone, password } = loginDto;

    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        'Your account has been banned. Please contact support.',
      );
    }

    const token = this.jwtService.sign({
      sub: user._id.toString(),
      phone: user.phone,
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
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15);

      await this.usersService.setResetCode(user._id.toString(), code, expires);
      await this.mailService.sendPasswordResetCode(dto.email, code);
    }

    return {
      message: 'If this email exists, a reset code has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (
      user.resetPasswordCode !== dto.code ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.resetPassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async resetPasswordByPhone(dto: ResetPasswordByPhoneDto) {
    const user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(dto.firebaseIdToken);
      const expectedPhone = dto.phone.startsWith('+2')
        ? dto.phone
        : `+2${dto.phone}`;
      if (decodedToken.phone_number !== expectedPhone) {
        throw new UnauthorizedException(
          'Phone number mismatch with Firebase OTP',
        );
      }
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || 'Invalid or expired Firebase OTP token',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // We update the password directly since OTP verification acted as our secure check
    await this.usersService.resetPassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successfully' };
  }
}
