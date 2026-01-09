import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsUrl } from 'class-validator';

export enum ContentType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export class CreateGatedContentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsString()
  contentUrl: string;

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
