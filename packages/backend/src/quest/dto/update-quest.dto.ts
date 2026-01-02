import { IsString, IsInt, Min, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateQuestDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rewardPoints?: number;
}
