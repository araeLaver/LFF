import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user with profile and wallet', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        profile: { nickname: 'TestUser', bio: 'Test bio' },
        wallet: {
          address: '0x123',
          nfts: [{ id: 'nft-1', tokenId: '1' }],
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          profile: true,
          wallet: {
            include: { nfts: true },
          },
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-1';
      const dto = { nickname: 'NewNickname', bio: 'New bio' };
      const updatedProfile = { id: 'profile-1', userId, ...dto };

      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(userId, dto);

      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: dto,
      });
    });

    it('should update only provided fields', async () => {
      const userId = 'user-1';
      const dto = { bio: 'Updated bio only' };
      const updatedProfile = {
        id: 'profile-1',
        userId,
        nickname: 'OldNickname',
        bio: 'Updated bio only',
      };

      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(userId, dto);

      expect(result.bio).toBe('Updated bio only');
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: dto,
      });
    });
  });

  describe('getNftGallery', () => {
    it('should return NFTs for user with wallet', async () => {
      const mockNfts = [
        { id: 'nft-1', tokenId: '1', name: 'NFT 1' },
        { id: 'nft-2', tokenId: '2', name: 'NFT 2' },
      ];
      const mockUser = {
        id: 'user-1',
        wallet: { nfts: mockNfts },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getNftGallery('user-1');

      expect(result).toEqual(mockNfts);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          wallet: {
            include: { nfts: true },
          },
        },
      });
    });

    it('should return empty array when user has no wallet', async () => {
      const mockUser = {
        id: 'user-1',
        wallet: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getNftGallery('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getNftGallery('nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array when wallet has no NFTs', async () => {
      const mockUser = {
        id: 'user-1',
        wallet: { nfts: [] },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getNftGallery('user-1');

      expect(result).toEqual([]);
    });
  });
});
