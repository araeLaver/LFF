import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as webPush from 'web-push';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private vapidConfigured = false;

  constructor(private prisma: PrismaService) {
    this.initializeVapid();
  }

  private initializeVapid() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@lff.local';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID keys configured for web push');
    } else {
      this.logger.warn('VAPID keys not configured. Push notifications disabled.');
    }
  }

  /**
   * Get VAPID public key for client
   */
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    // Check if subscription already exists
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update if exists
      return this.prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId,
        },
      });
    }

    return this.prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
      },
    });
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Create a notification and optionally send push
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    sendPush: boolean = true,
  ) {
    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data || {},
        userId,
      },
    });

    // Send push notification if enabled
    if (sendPush && this.vapidConfigured) {
      await this.sendPushToUser(userId, title, message, data);
    }

    return notification;
  }

  /**
   * Send push notification to a specific user
   */
  async sendPushToUser(userId: string, title: string, body: string, data?: Record<string, any>) {
    if (!this.vapidConfigured) {
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      ),
    );

    // Clean up invalid subscriptions
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const error = (results[i] as PromiseRejectedResult).reason;
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription expired or invalid, remove it
          await this.prisma.pushSubscription.delete({
            where: { id: subscriptions[i].id },
          }).catch(() => {});
        }
      }
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
  }

  // Helper methods for common notification types
  async notifyQuestApproved(userId: string, questTitle: string, questId: string) {
    return this.createNotification(
      userId,
      'QUEST_APPROVED',
      'Quest Approved!',
      `Your submission for "${questTitle}" has been approved.`,
      { questId },
    );
  }

  async notifyQuestRejected(userId: string, questTitle: string, questId: string) {
    return this.createNotification(
      userId,
      'QUEST_REJECTED',
      'Quest Submission Rejected',
      `Your submission for "${questTitle}" was not approved.`,
      { questId },
    );
  }

  async notifyNftMinted(userId: string, tokenId: string, name: string) {
    return this.createNotification(
      userId,
      'NFT_MINTED',
      'New NFT Received!',
      `You received a new NFT: "${name}"`,
      { tokenId },
    );
  }

  async notifyNewContent(userId: string, contentTitle: string, contentId: string) {
    return this.createNotification(
      userId,
      'NEW_CONTENT',
      'New Exclusive Content',
      `New content available: "${contentTitle}"`,
      { contentId },
    );
  }
}
