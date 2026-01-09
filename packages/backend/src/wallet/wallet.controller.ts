import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LinkWalletDto, GetNonceDto } from './dto/link-wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // Get nonce for wallet signature
  @Get('nonce')
  getNonce(@Query() query: GetNonceDto) {
    const nonce = this.walletService.generateNonce();
    const message = this.walletService.generateNonceMessage(nonce);
    return { nonce, message };
  }

  // Get current user's wallet
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@CurrentUser() user: any) {
    const wallet = await this.walletService.getUserWallet(user.id);
    return wallet;
  }

  // Link external wallet to user account
  @Post('link')
  @UseGuards(JwtAuthGuard)
  async linkWallet(@CurrentUser() user: any, @Body() dto: LinkWalletDto) {
    return this.walletService.linkExternalWallet(
      user.id,
      dto.address,
      dto.signature,
      dto.message,
      dto.chainId,
    );
  }

  // Unlink wallet from user account
  @Delete('unlink')
  @UseGuards(JwtAuthGuard)
  async unlinkWallet(@CurrentUser() user: any) {
    return this.walletService.unlinkWallet(user.id);
  }
}
