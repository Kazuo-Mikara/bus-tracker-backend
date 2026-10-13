import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyStopQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(50000)
  radius?: number = 2000; // default 2km
}
