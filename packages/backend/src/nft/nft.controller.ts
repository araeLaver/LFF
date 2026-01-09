import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { NftService } from './nft.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MintNftDto } from './dto/mint-nft.dto';

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

  @Post('mint')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  mintNft(@CurrentUser() user: any, @Body() dto: MintNftDto) {
    return this.nftService.creatorMintNft(user.id, dto);
  }

  @Get('minting-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  getMintingHistory(@CurrentUser() user: any) {
    return this.nftService.getCreatorMintingHistory(user.id);
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
