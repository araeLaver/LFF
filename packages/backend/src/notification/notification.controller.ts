import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    const key = this.notificationService.getVapidPublicKey();
    return { publicKey: key };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser() user: any,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.notificationService.subscribe(user.id, body);
  }

  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@CurrentUser() user: any, @Body('endpoint') endpoint: string) {
    return this.notificationService.unsubscribe(user.id, endpoint);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getUserNotifications(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationService.getUnreadCount(user.id).then((count) => ({ count }));
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
