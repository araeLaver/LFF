import { IsString, IsOptional } from 'class-validator';

export class SubmitQuestDto {
  @IsOptional()
  @IsString()
  proofUrl?: string;
}
