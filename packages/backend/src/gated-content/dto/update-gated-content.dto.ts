import { IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { ContentType, ContentStatus } from './create-gated-content.dto';

export class UpdateGatedContentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsString()
  requiredNftContract?: string;

  @IsOptional()
  @IsString()
  requiredTokenId?: string;

  @IsOptional()
  @IsString()
  requiredNftId?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
