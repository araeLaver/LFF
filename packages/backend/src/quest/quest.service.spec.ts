import { Test, TestingModule } from '@nestjs/testing';
import { QuestService } from './quest.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MetadataService } from '../blockchain/metadata.service';
import { NotificationService } from '../notification/notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';

describe('QuestService', () => {
  let service: QuestService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    quest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    questSubmission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
    },
    nFT: {
      create: jest.fn(),
    },
  };

  const mockBlockchainService = {
    isReady: jest.fn(),
    mintQuestCompletion: jest.fn(),
    getContractAddress: jest.fn(),
  };

  const mockMetadataService = {};

  const mockNotificationService = {
    notifyQuestApproved: jest.fn(),
    notifyQuestRejected: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BlockchainService, useValue: mockBlockchainService },
        { provide: MetadataService, useValue: mockMetadataService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<QuestService>(QuestService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuest', () => {
    it('should create a quest', async () => {
      const dto = {
        title: 'Test Quest',
        description: 'Test Description',
        rewardPoints: 100,
      };
      const creatorId = 'creator-1';

      const expectedQuest = {
        id: 'quest-1',
        ...dto,
        creatorId,
      };

      mockPrismaService.quest.create.mockResolvedValue(expectedQuest);

      const result = await service.createQuest(creatorId, dto);

      expect(result).toEqual(expectedQuest);
      expect(mockPrismaService.quest.create).toHaveBeenCalledWith({
        data: { ...dto, creatorId },
      });
    });
  });

  describe('findAllQuests', () => {
    it('should return all quests with creator info', async () => {
      const mockQuests = [
        {
          id: 'quest-1',
          title: 'Quest 1',
          creator: { user: { profile: { nickname: 'Creator1' } } },
        },
        {
          id: 'quest-2',
          title: 'Quest 2',
          creator: { user: { profile: { nickname: 'Creator2' } } },
        },
      ];

      mockPrismaService.quest.findMany.mockResolvedValue(mockQuests);

      const result = await service.findAllQuests();

      expect(result).toEqual(mockQuests);
      expect(mockPrismaService.quest.findMany).toHaveBeenCalledWith({
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
        },
      });
    });
  });

  describe('findQuestById', () => {
    it('should return quest by id', async () => {
      const mockQuest = {
        id: 'quest-1',
        title: 'Test Quest',
        creator: { user: { profile: { nickname: 'Creator' } } },
        submissions: [],
      };

      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);

      const result = await service.findQuestById('quest-1');

      expect(result).toEqual(mockQuest);
    });

    it('should throw NotFoundException when quest not found', async () => {
      mockPrismaService.quest.findUnique.mockResolvedValue(null);

      await expect(service.findQuestById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitQuest', () => {
    it('should create a submission', async () => {
      const mockQuest = { id: 'quest-1', title: 'Test Quest' };
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);

      const expectedSubmission = {
        id: 'submission-1',
        userId: 'user-1',
        questId: 'quest-1',
        proofUrl: 'http://proof.url',
        status: SubmissionStatus.PENDING,
      };
      mockPrismaService.questSubmission.create.mockResolvedValue(expectedSubmission);

      const result = await service.submitQuest('user-1', 'quest-1', { proofUrl: 'http://proof.url' });

      expect(result).toEqual(expectedSubmission);
    });

    it('should throw NotFoundException when quest not found', async () => {
      mockPrismaService.quest.findUnique.mockResolvedValue(null);

      await expect(
        service.submitQuest('user-1', 'nonexistent', { proofUrl: 'http://proof.url' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reviewSubmission', () => {
    const mockSubmission = {
      id: 'submission-1',
      userId: 'user-1',
      questId: 'quest-1',
      quest: {
        id: 'quest-1',
        title: 'Test Quest',
        creatorId: 'creator-1',
      },
    };

    it('should approve submission and send notification', async () => {
      mockPrismaService.questSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.questSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
      });
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.reviewSubmission(
        'creator-1',
        'submission-1',
        SubmissionStatus.APPROVED,
      );

      expect(result.submission.status).toBe(SubmissionStatus.APPROVED);
      expect(mockNotificationService.notifyQuestApproved).toHaveBeenCalledWith(
        'user-1',
        'Test Quest',
        'quest-1',
      );
    });

    it('should reject submission and send notification', async () => {
      mockPrismaService.questSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.questSubmission.update.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.REJECTED,
      });

      const result = await service.reviewSubmission(
        'creator-1',
        'submission-1',
        SubmissionStatus.REJECTED,
      );

      expect(result.submission.status).toBe(SubmissionStatus.REJECTED);
      expect(mockNotificationService.notifyQuestRejected).toHaveBeenCalledWith(
        'user-1',
        'Test Quest',
        'quest-1',
      );
    });

    it('should throw NotFoundException when submission not found', async () => {
      mockPrismaService.questSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewSubmission('creator-1', 'nonexistent', SubmissionStatus.APPROVED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not creator', async () => {
      mockPrismaService.questSubmission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.reviewSubmission('other-creator', 'submission-1', SubmissionStatus.APPROVED),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateQuest', () => {
    it('should update quest when authorized', async () => {
      const mockQuest = { id: 'quest-1', creatorId: 'creator-1' };
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, title: 'Updated' });

      const result = await service.updateQuest('quest-1', 'creator-1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException when not creator', async () => {
      const mockQuest = { id: 'quest-1', creatorId: 'creator-1' };
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);

      await expect(
        service.updateQuest('quest-1', 'other-creator', { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteQuest', () => {
    it('should delete quest when authorized', async () => {
      const mockQuest = { id: 'quest-1', creatorId: 'creator-1' };
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.quest.delete.mockResolvedValue(mockQuest);

      const result = await service.deleteQuest('quest-1', 'creator-1');

      expect(result).toEqual(mockQuest);
      expect(mockPrismaService.quest.delete).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
      });
    });

    it('should throw ForbiddenException when not creator', async () => {
      const mockQuest = { id: 'quest-1', creatorId: 'creator-1' };
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);

      await expect(service.deleteQuest('quest-1', 'other-creator')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
