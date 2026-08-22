import {
  IsBooleanString,
  IsIn,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetPropertiesDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsNumberString()
  bedrooms?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsIn(['Sale', 'Rent'])
  listingPurpose?: 'Sale' | 'Rent';

  @IsOptional()
  @IsEnum(['latest', 'priceAsc', 'priceDesc'])
  sort?: 'latest' | 'priceAsc' | 'priceDesc';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  featured?: string;

  @IsOptional()
  @IsEnum([
    'Pending',
    'Published',
    'Rented',
    'Rejected',
    'Expired',
  ])
  status?: string;
}
