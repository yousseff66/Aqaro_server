import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian number (e.g. 01012345678)',
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
