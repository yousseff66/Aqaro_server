import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InstaPayDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  number?: string;
}

class VodafoneCashDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  number?: string;
}

class VisaDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  holder?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;
}

class PaymentMethodsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => InstaPayDto)
  instaPay?: InstaPayDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VodafoneCashDto)
  vodafoneCash?: VodafoneCashDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VisaDto)
  visa?: VisaDto;
}

export class UpdatePlatformSettingsDto {
  @IsOptional()
  @IsNumber()
  normalListingPrice?: number;

  @IsOptional()
  @IsNumber()
  featuredPriceWeek?: number;

  @IsOptional()
  @IsNumber()
  featuredPriceTwoWeeks?: number;

  @IsOptional()
  @IsNumber()
  featuredPriceMonth?: number;

  @IsOptional()
  @IsNumber()
  listingDurationDays?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodsDto)
  paymentMethods?: PaymentMethodsDto;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsNumber()
  maxImagesPerProperty?: number;
}