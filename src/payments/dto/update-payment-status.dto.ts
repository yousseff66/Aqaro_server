import { IsOptional, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
