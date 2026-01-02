import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MetadataController],
  providers: [BlockchainService, MetadataService],
  exports: [BlockchainService, MetadataService],
})
export class BlockchainModule {}
