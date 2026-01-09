import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    pushSubscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Clear VAPID env vars for testing
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVapidPublicKey', () => {
    it('should return null when VAPID key not configured', () => {
      const result = service.getVapidPublicKey();
      expect(result).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should create new subscription when not exists', async () => {
      const subscription = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'publicKey', auth: 'authSecret' },
      };

      mockPrismaService.pushSubscription.findUnique.mockResolvedValue(null);
      mockPrismaService.pushSubscription.create.mockResolvedValue({
        id: 'sub-1',
        ...subscription,
        userId: 'user-1',
      });

      const result = await service.subscribe('user-1', subscription);

      expect(result.id).toBe('sub-1');
      expect(mockPrismaService.pushSubscription.create).toHaveBeenCalledWith({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: 'user-1',
        },
      });
    });

    it('should update subscription when already exists', async () => {
      const subscription = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'newPublicKey', auth: 'newAuthSecret' },
      };

      mockPrismaService.pushSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        endpoint: subscription.endpoint,
      });
      mockPrismaService.pushSubscription.update.mockResolvedValue({
        id: 'sub-1',
        ...subscription,
        userId: 'user-1',
      });

      const result = await service.subscribe('user-1', subscription);

      expect(mockPrismaService.pushSubscription.update).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should delete subscription', async () => {
      mockPrismaService.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      await service.unsubscribe('user-1', 'https://push.example.com/123');

      expect(mockPrismaService.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', endpoint: 'https://push.example.com/123' },
      });
    });
  });

  describe('createNotification', () => {
    it('should create notification without push when VAPID not configured', async () => {
      const mockNotification = {
        id: 'notif-1',
        type: NotificationType.QUEST_APPROVED,
        title: 'Test Title',
        message: 'Test Message',
        userId: 'user-1',
        isRead: false,
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        'user-1',
        NotificationType.QUEST_APPROVED,
        'Test Title',
        'Test Message',
        { questId: 'quest-1' },
      );

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          type: NotificationType.QUEST_APPROVED,
          title: 'Test Title',
          message: 'Test Message',
          data: { questId: 'quest-1' },
          userId: 'user-1',
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications with unread count', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1' },
        { id: 'notif-2', title: 'Notification 2' },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3); // unread

      const result = await service.getUserNotifications('user-1', 1, 20);

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 10,
        unreadCount: 3,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('user-1', 'notif-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('helper methods', () => {
    beforeEach(() => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });
    });

    it('notifyQuestApproved should create correct notification', async () => {
      await service.notifyQuestApproved('user-1', 'Test Quest', 'quest-1');

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.QUEST_APPROVED,
          title: 'Quest Approved!',
          message: 'Your submission for "Test Quest" has been approved.',
          data: { questId: 'quest-1' },
          userId: 'user-1',
        }),
      });
    });

    it('notifyQuestRejected should create correct notification', async () => {
      await service.notifyQuestRejected('user-1', 'Test Quest', 'quest-1');

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.QUEST_REJECTED,
          title: 'Quest Submission Rejected',
          message: 'Your submission for "Test Quest" was not approved.',
          data: { questId: 'quest-1' },
          userId: 'user-1',
        }),
      });
    });

    it('notifyNftMinted should create correct notification', async () => {
      await service.notifyNftMinted('user-1', 'token-123', 'My NFT');

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.NFT_MINTED,
          title: 'New NFT Received!',
          message: 'You received a new NFT: "My NFT"',
          data: { tokenId: 'token-123' },
          userId: 'user-1',
        }),
      });
    });
  });
});
