import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';
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
import { BlockchainModule } from './blockchain/blockchain.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,      // 1 second
        limit: 10,      // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,     // 1 minute
        limit: 100,     // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000,   // 1 hour
        limit: 1000,    // 1000 requests per hour
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
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
    BlockchainModule,
    UploadModule,
    AdminModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
