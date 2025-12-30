import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { NftService } from './nft.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('nfts')
export class NftController {
  constructor(private nftService: NftService) {}

  @Get()
  findAll() {
    return this.nftService.getAllNfts();
  }

  @Get('my-nfts')
  @UseGuards(JwtAuthGuard)
  getMyNfts(@CurrentUser() user: any) {
    return this.nftService.getUserNfts(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nftService.getNftById(id);
  }

  @Get('token/:tokenId')
  findByTokenId(@Param('tokenId') tokenId: string) {
    return this.nftService.getNftByTokenId(tokenId);
  }

  @Get('contract/:contractAddress')
  findByContract(@Param('contractAddress') contractAddress: string) {
    return this.nftService.getNftsByContract(contractAddress);
  }
}
