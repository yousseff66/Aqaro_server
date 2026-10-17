import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsMongoId()
  propertyId: string;

  @IsEnum(['Scam', 'FakePhotos', 'Broker', 'Spam', 'AlreadyRented', 'Other'])
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}
