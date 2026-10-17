import { IsNumberString, IsOptional } from 'class-validator';

export class NearbyPropertiesDto {
  @IsNumberString()
  lat!: string;

  @IsNumberString()
  lng!: string;

  @IsOptional()
  @IsNumberString()
  radius?: string;
}
