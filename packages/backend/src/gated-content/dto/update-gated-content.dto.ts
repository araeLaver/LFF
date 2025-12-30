import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateGatedContentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  requiredNftId?: string;
}
