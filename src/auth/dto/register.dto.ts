import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian number (e.g. 01012345678)',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  firebaseIdToken!: string;
}
