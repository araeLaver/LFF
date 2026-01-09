import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum MintTokenType {
  EVENT_ATTENDANCE = 'EVENT_ATTENDANCE',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  CUSTOM = 'CUSTOM',
}

export class MintNftDto {
  @IsString()
  recipientAddress: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsEnum(MintTokenType)
  tokenType: MintTokenType;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
