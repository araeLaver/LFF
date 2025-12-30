import { Module } from '@nestjs/common';
import { GatedContentController } from './gated-content.controller';
import { GatedContentService } from './gated-content.service';

@Module({
  controllers: [GatedContentController],
  providers: [GatedContentService],
  exports: [GatedContentService],
})
export class GatedContentModule {}
