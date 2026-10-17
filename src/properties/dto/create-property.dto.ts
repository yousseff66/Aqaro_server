import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @IsIn(['Point'])
  type!: 'Point';

  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v: any) => Number(v)) : value,
  )
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  price!: number;

  @IsString()
  governorate!: string;

  @IsString()
  city!: string;

  @IsString()
  address!: string;

  @Type(() => Number)
  @IsNumber()
  bedrooms!: number;

  @Type(() => Number)
  @IsNumber()
  bathrooms!: number;

  @Type(() => Number)
  @IsNumber()
  area!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  floor?: number;

  @IsString()
  propertyType!: string;

  @IsIn(['Sale', 'Rent'])
  listingPurpose!: 'Sale' | 'Rent';

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  furnished!: boolean;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  showExactLocation?: boolean;

  @IsOptional()
  @IsEnum(['Normal', 'Featured'])
  listingType?: 'Normal' | 'Featured';

  @IsOptional()
  @IsIn(['week', 'twoWeeks', 'month'])
  featuredDuration?: 'week' | 'twoWeeks' | 'month';
}
