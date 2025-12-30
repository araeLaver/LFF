import { IsString, IsInt, Min, MinLength, MaxLength } from 'class-validator';

export class CreateQuestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsInt()
  @Min(1)
  rewardPoints: number;
}
