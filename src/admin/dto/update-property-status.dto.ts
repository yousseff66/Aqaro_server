import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePropertyStatusDto {
  @IsEnum(['Pending', 'Published', 'Rejected', 'Rented', 'Expired'])
  status!: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
