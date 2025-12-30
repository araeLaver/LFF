import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateGatedContentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsString()
  requiredNftId?: string;
}
