import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CreatorModule } from './creator/creator.module';
import { QuestModule } from './quest/quest.module';
import { EventModule } from './event/event.module';
import { GatedContentModule } from './gated-content/gated-content.module';
import { NftModule } from './nft/nft.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CreatorModule,
    QuestModule,
    EventModule,
    GatedContentModule,
    NftModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
