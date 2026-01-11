import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MetadataService } from '../blockchain/metadata.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQrImage'),
}));

describe('EventService', () => {
  let service: EventService;
  let prismaService: PrismaService;
  let blockchainService: BlockchainService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    qRCode: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    qRCodeRedemption: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
    mintEventAttendance: jest.fn(),
    getContractAddress: jest.fn(),
  };

  const mockMetadataService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BlockchainService, useValue: mockBlockchainService },
        { provide: MetadataService, useValue: mockMetadataService },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    prismaService = module.get<PrismaService>(PrismaService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const creatorId = 'creator-1';
      const dto = {
        title: 'Test Event',
        description: 'A test event',
        eventDate: '2026-02-01T10:00:00Z',
      };
      const mockEvent = {
        id: 'event-1',
        ...dto,
        eventDate: new Date(dto.eventDate),
        creatorId,
      };

      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.createEvent(creatorId, dto);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          eventDate: new Date(dto.eventDate),
          creatorId,
        },
      });
    });
  });

  describe('findAllEvents', () => {
    it('should return all events with creator info', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          creator: { user: { profile: { nickname: 'Creator1' } } },
        },
        {
          id: 'event-2',
          title: 'Event 2',
          creator: { user: { profile: { nickname: 'Creator2' } } },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAllEvents();

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
        },
        orderBy: { eventDate: 'desc' },
      });
    });
  });

  describe('findEventById', () => {
    it('should return an event with details', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        creator: { user: { profile: { nickname: 'Creator' } } },
        qrcodes: [],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findEventById('event-1');

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
          qrcodes: true,
        },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findEventById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an event when authorized', async () => {
      const eventId = 'event-1';
      const creatorId = 'creator-1';
      const dto = { title: 'Updated Title' };
      const mockEvent = { id: eventId, creatorId };
      const updatedEvent = { ...mockEvent, title: 'Updated Title' };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      const result = await service.updateEvent(eventId, creatorId, dto);

      expect(result).toEqual(updatedEvent);
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { ...dto, eventDate: undefined },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEvent('nonexistent', 'creator-1', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not authorized', async () => {
      const mockEvent = { id: 'event-1', creatorId: 'creator-1' };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.updateEvent('event-1', 'other-creator', { title: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event when authorized', async () => {
      const eventId = 'event-1';
      const creatorId = 'creator-1';
      const mockEvent = { id: eventId, creatorId };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.deleteEvent(eventId, creatorId);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteEvent('nonexistent', 'creator-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not authorized', async () => {
      const mockEvent = { id: 'event-1', creatorId: 'creator-1' };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.deleteEvent('event-1', 'other-creator'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateQRCode', () => {
    it('should generate a QR code for an event', async () => {
      const eventId = 'event-1';
      const creatorId = 'creator-1';
      const mockEvent = { id: eventId, creatorId };
      const mockQRCode = { id: 'qr-1', code: 'uuid-code', eventId };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.qRCode.create.mockResolvedValue(mockQRCode);

      const result = await service.generateQRCode(eventId, creatorId);

      expect(result.qrcode).toEqual(mockQRCode);
      expect(result.qrImage).toBe('data:image/png;base64,mockQrImage');
      expect(mockPrismaService.qRCode.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.generateQRCode('nonexistent', 'creator-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not authorized', async () => {
      const mockEvent = { id: 'event-1', creatorId: 'creator-1' };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.generateQRCode('event-1', 'other-creator'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('redeemQRCode', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Test Event',
      eventDate: new Date('2026-01-15'),
    };
    const mockQRCode = {
      id: 'qr-1',
      code: 'valid-code',
      isActive: true,
      eventId: 'event-1',
      event: mockEvent,
    };

    it('should redeem a QR code successfully', async () => {
      const userId = 'user-1';
      const redemption = { id: 'redeem-1', userId, qrCodeId: 'qr-1' };

      mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQRCode);
      mockPrismaService.qRCodeRedemption.findUnique.mockResolvedValue(null);
      mockPrismaService.qRCodeRedemption.create.mockResolvedValue({
        ...redemption,
        qrcode: mockQRCode,
      });
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.redeemQRCode(userId, 'valid-code');

      expect(result.message).toBe('QR code redeemed successfully');
      expect(result.event).toEqual(mockEvent);
      expect(mockPrismaService.qRCodeRedemption.create).toHaveBeenCalled();
    });

    it('should mint SBT when blockchain is ready', async () => {
      const userId = 'user-1';
      const mockWallet = { id: 'wallet-1', address: '0x123', userId };
      const mockMintResult = {
        tokenId: '1',
        transactionHash: '0xabc',
        blockNumber: 123,
      };

      mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQRCode);
      mockPrismaService.qRCodeRedemption.findUnique.mockResolvedValue(null);
      mockPrismaService.qRCodeRedemption.create.mockResolvedValue({
        qrcode: mockQRCode,
      });
      mockBlockchainService.isReady.mockReturnValue(true);
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockBlockchainService.mintEventAttendance.mockResolvedValue(
        mockMintResult,
      );
      mockBlockchainService.getContractAddress.mockReturnValue('0xcontract');
      mockPrismaService.nFT.create.mockResolvedValue({});

      const result = await service.redeemQRCode(userId, 'valid-code');

      expect(result.mintResult).toEqual(mockMintResult);
      expect(mockBlockchainService.mintEventAttendance).toHaveBeenCalled();
      expect(mockPrismaService.nFT.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when QR code not found', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue(null);

      await expect(
        service.redeemQRCode('user-1', 'invalid-code'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when QR code is inactive', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue({
        ...mockQRCode,
        isActive: false,
      });

      await expect(
        service.redeemQRCode('user-1', 'valid-code'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when already redeemed', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQRCode);
      mockPrismaService.qRCodeRedemption.findUnique.mockResolvedValue({
        id: 'existing',
      });

      await expect(
        service.redeemQRCode('user-1', 'valid-code'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getCreatorEvents', () => {
    it('should return all events for a creator', async () => {
      const creatorId = 'creator-1';
      const mockEvents = [
        { id: 'event-1', title: 'Event 1', creatorId, qrcodes: [] },
        { id: 'event-2', title: 'Event 2', creatorId, qrcodes: [] },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getCreatorEvents(creatorId);

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: { creatorId },
        include: {
          qrcodes: {
            include: {
              redemptions: {
                include: {
                  user: { include: { profile: true } },
                },
              },
            },
          },
        },
        orderBy: { eventDate: 'desc' },
      });
    });
  });

  describe('deactivateQRCode', () => {
    it('should deactivate a QR code when authorized', async () => {
      const qrCodeId = 'qr-1';
      const creatorId = 'creator-1';
      const mockQRCode = {
        id: qrCodeId,
        event: { creatorId },
        isActive: true,
      };

      mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQRCode);
      mockPrismaService.qRCode.update.mockResolvedValue({
        ...mockQRCode,
        isActive: false,
      });

      const result = await service.deactivateQRCode(qrCodeId, creatorId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.qRCode.update).toHaveBeenCalledWith({
        where: { id: qrCodeId },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when QR code not found', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue(null);

      await expect(
        service.deactivateQRCode('nonexistent', 'creator-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not authorized', async () => {
      const mockQRCode = {
        id: 'qr-1',
        event: { creatorId: 'creator-1' },
      };
      mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQRCode);

      await expect(
        service.deactivateQRCode('qr-1', 'other-creator'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
