import { IsEnum } from 'class-validator';
import { SubmissionStatus } from '@prisma/client';

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;
}
