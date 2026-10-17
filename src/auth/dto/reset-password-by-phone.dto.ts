import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordByPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian number (e.g. 01012345678)',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  firebaseIdToken!: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  newPassword!: string;
}
