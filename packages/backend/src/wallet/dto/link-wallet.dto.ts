import { IsString, IsOptional, IsInt } from 'class-validator';

export class LinkWalletDto {
  @IsString()
  address: string;

  @IsString()
  signature: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  chainId?: number;
}

export class GetNonceDto {
  @IsString()
  address: string;
}
