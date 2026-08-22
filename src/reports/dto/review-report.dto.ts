import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReviewReportDto {
  @IsIn([
    'Reviewed',
    'Rejected',
  ])
  status: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}