import { IsIn, IsOptional, IsString } from 'class-validator';

export class FcmTokenDto {
  @IsString()
  token!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RemoveFcmTokenDto {
  @IsString()
  token!: string;
}
