import { IsString, Matches } from 'class-validator';

export class ChangePhoneDto {
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Phone number must be a valid Egyptian number',
  })
  phone!: string;

  @IsString()
  firebaseIdToken!: string;
}
