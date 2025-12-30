import { IsString } from 'class-validator';

export class RedeemQrDto {
  @IsString()
  code: string;
}
