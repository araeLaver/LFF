import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [NftController],
  providers: [NftService],
  exports: [NftService],
})
export class NftModule {}
