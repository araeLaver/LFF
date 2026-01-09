import { Module } from '@nestjs/common';
import { GatedContentController } from './gated-content.controller';
import { GatedContentService } from './gated-content.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [GatedContentController],
  providers: [GatedContentService],
  exports: [GatedContentService],
})
export class GatedContentModule {}
