import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, TokenType } from '../blockchain/blockchain.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MintTokenType } from './dto/mint-nft.dto';

describe('NftService', () => {
  let service: NftService;
  let prismaService: PrismaService;
  let blockchainService: BlockchainService;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    nFT: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    creator: {
      findUnique: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    quest: {
      findUnique: jest.fn(),
    },
  };

  const mockBlockchainService = {
    isReady: jest.fn(),
    getTokenMetadata: jest.fn(),
    mintEventAttendance: jest.fn(),
    mintQuestCompletion: jest.fn(),
    getContractAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BlockchainService, useValue: mockBlockchainService },
      ],
    }).compile();

    service = module.get<NftService>(NftService);
    prismaService = module.get<PrismaService>(PrismaService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserNfts', () => {
    it('should return empty array when user has no wallet', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getUserNfts('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when wallet has no NFTs', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        nfts: [],
      });

      const result = await service.getUserNfts('user-1');

      expect(result).toEqual([]);
    });

    it('should return enriched NFTs for user', async () => {
      const mockNfts = [
        {
          id: 'nft-1',
          tokenId: '1',
          contractAddress: '0xcontract',
          metadataUrl: 'http://example.com/metadata/event/event-1',
          ownerId: 'wallet-1',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        nfts: mockNfts,
      });
      mockBlockchainService.isReady.mockReturnValue(false);
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Test Event',
      });

      const result = await service.getUserNfts('user-1');

      expect(result.length).toBe(1);
      expect(result[0].tokenId).toBe('1');
    });
  });

  describe('getNftById', () => {
    it('should return NFT with metadata', async () => {
      const mockNft = {
        id: 'nft-1',
        tokenId: '1',
        contractAddress: '0xcontract',
        metadataUrl: 'http://example.com/metadata',
        ownerId: 'wallet-1',
        createdAt: new Date(),
        owner: { user: { profile: { nickname: 'User' } } },
      };

      mockPrismaService.nFT.findUnique.mockResolvedValue(mockNft);
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.getNftById('nft-1');

      expect(result.id).toBe('nft-1');
      expect(result.tokenId).toBe('1');
    });

    it('should throw NotFoundException when NFT not found', async () => {
      mockPrismaService.nFT.findUnique.mockResolvedValue(null);

      await expect(service.getNftById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getNftByTokenId', () => {
    it('should return NFT by token ID', async () => {
      const mockNft = {
        id: 'nft-1',
        tokenId: '123',
        contractAddress: '0xcontract',
        metadataUrl: 'http://example.com/metadata',
        ownerId: 'wallet-1',
        createdAt: new Date(),
        owner: { user: { profile: { nickname: 'User' } } },
      };

      mockPrismaService.nFT.findUnique.mockResolvedValue(mockNft);
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.getNftByTokenId('123');

      expect(result.tokenId).toBe('123');
    });

    it('should throw NotFoundException when NFT not found', async () => {
      mockPrismaService.nFT.findUnique.mockResolvedValue(null);

      await expect(service.getNftByTokenId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mintNft', () => {
    it('should create NFT record', async () => {
      const mockNft = {
        id: 'nft-1',
        tokenId: '1',
        contractAddress: '0xcontract',
        metadataUrl: 'http://example.com/metadata',
        ownerId: 'wallet-1',
      };

      mockPrismaService.nFT.create.mockResolvedValue(mockNft);

      const result = await service.mintNft(
        'wallet-1',
        '1',
        '0xcontract',
        'http://example.com/metadata',
      );

      expect(result).toEqual(mockNft);
      expect(mockPrismaService.nFT.create).toHaveBeenCalledWith({
        data: {
          tokenId: '1',
          contractAddress: '0xcontract',
          metadataUrl: 'http://example.com/metadata',
          ownerId: 'wallet-1',
        },
      });
    });
  });

  describe('creatorMintNft', () => {
    const creatorId = 'creator-1';
    const validDto = {
      recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenType: MintTokenType.EVENT_ATTENDANCE,
      name: 'Test NFT',
      description: 'A test NFT',
      referenceId: 'event-1',
    };

    it('should throw BadRequestException when not a creator', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue(null);

      await expect(service.creatorMintNft(creatorId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when blockchain not ready', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue({ id: 'c-1' });
      mockBlockchainService.isReady.mockReturnValue(false);

      await expect(service.creatorMintNft(creatorId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid address format', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue({ id: 'c-1' });
      mockBlockchainService.isReady.mockReturnValue(true);

      await expect(
        service.creatorMintNft(creatorId, {
          ...validDto,
          recipientAddress: 'invalid-address',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mint NFT successfully for existing wallet', async () => {
      const mintResult = {
        tokenId: '1',
        transactionHash: '0xabc',
        blockNumber: 123,
      };
      const mockWallet = {
        id: 'wallet-1',
        address: validDto.recipientAddress.toLowerCase(),
      };
      const mockCreator = { id: 'c-1', userId: creatorId };

      mockPrismaService.creator.findUnique
        .mockResolvedValueOnce(mockCreator)
        .mockResolvedValueOnce(mockCreator);
      mockBlockchainService.isReady.mockReturnValue(true);
      mockBlockchainService.mintEventAttendance.mockResolvedValue(mintResult);
      mockBlockchainService.getContractAddress.mockReturnValue('0xcontract');
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.nFT.create.mockResolvedValue({
        id: 'nft-1',
        tokenId: '1',
      });

      const result = await service.creatorMintNft(creatorId, validDto);

      expect(result.tokenId).toBe('1');
      expect(result.transactionHash).toBe('0xabc');
      expect(mockBlockchainService.mintEventAttendance).toHaveBeenCalled();
    });

    it('should create placeholder user for new wallet', async () => {
      const mintResult = {
        tokenId: '1',
        transactionHash: '0xabc',
        blockNumber: 123,
      };
      const mockCreator = { id: 'c-1', userId: creatorId };

      mockPrismaService.creator.findUnique
        .mockResolvedValueOnce(mockCreator)
        .mockResolvedValueOnce(mockCreator);
      mockBlockchainService.isReady.mockReturnValue(true);
      mockBlockchainService.mintEventAttendance.mockResolvedValue(mintResult);
      mockBlockchainService.getContractAddress.mockReturnValue('0xcontract');
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({ id: 'new-user' });
      mockPrismaService.wallet.create.mockResolvedValue({
        id: 'new-wallet',
        address: validDto.recipientAddress.toLowerCase(),
      });
      mockPrismaService.nFT.create.mockResolvedValue({
        id: 'nft-1',
        tokenId: '1',
      });

      const result = await service.creatorMintNft(creatorId, validDto);

      expect(result.tokenId).toBe('1');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.wallet.create).toHaveBeenCalled();
    });

    it('should mint QUEST_COMPLETION type', async () => {
      const questDto = {
        ...validDto,
        tokenType: MintTokenType.QUEST_COMPLETION,
        referenceId: 'quest-1',
      };
      const mintResult = {
        tokenId: '2',
        transactionHash: '0xdef',
        blockNumber: 124,
      };
      const mockCreator = { id: 'c-1', userId: creatorId };
      const mockWallet = {
        id: 'wallet-1',
        address: validDto.recipientAddress.toLowerCase(),
      };

      mockPrismaService.creator.findUnique
        .mockResolvedValueOnce(mockCreator)
        .mockResolvedValueOnce(mockCreator);
      mockBlockchainService.isReady.mockReturnValue(true);
      mockBlockchainService.mintQuestCompletion.mockResolvedValue(mintResult);
      mockBlockchainService.getContractAddress.mockReturnValue('0xcontract');
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.nFT.create.mockResolvedValue({
        id: 'nft-2',
        tokenId: '2',
      });

      const result = await service.creatorMintNft(creatorId, questDto);

      expect(result.tokenId).toBe('2');
      expect(mockBlockchainService.mintQuestCompletion).toHaveBeenCalled();
    });
  });

  describe('getCreatorMintingHistory', () => {
    it('should return empty array when not a creator', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue(null);

      const result = await service.getCreatorMintingHistory('user-1');

      expect(result).toEqual([]);
    });

    it('should return minting history for creator', async () => {
      const mockCreator = { id: 'c-1' };
      const mockNfts = [
        {
          id: 'nft-1',
          tokenId: '1',
          name: 'NFT 1',
          description: 'Test',
          tokenType: 'EVENT_ATTENDANCE',
          referenceId: 'event-1',
          transactionHash: '0xabc',
          createdAt: new Date(),
          owner: {
            address: '0x123',
            user: { profile: { nickname: 'User1' } },
          },
        },
      ];

      mockPrismaService.creator.findUnique.mockResolvedValue(mockCreator);
      mockPrismaService.nFT.findMany.mockResolvedValue(mockNfts);

      const result = await service.getCreatorMintingHistory('creator-1');

      expect(result.length).toBe(1);
      expect(result[0].tokenId).toBe('1');
      expect(result[0].recipientAddress).toBe('0x123');
    });
  });

  describe('getAllNfts', () => {
    it('should return all NFTs with metadata', async () => {
      const mockNfts = [
        {
          id: 'nft-1',
          tokenId: '1',
          contractAddress: '0xcontract',
          metadataUrl: 'http://example.com/metadata',
          ownerId: 'wallet-1',
          createdAt: new Date(),
          owner: { user: { profile: { nickname: 'User' } } },
        },
      ];

      mockPrismaService.nFT.findMany.mockResolvedValue(mockNfts);
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.getAllNfts();

      expect(result.length).toBe(1);
    });
  });

  describe('getNftsByContract', () => {
    it('should return NFTs for specific contract', async () => {
      const contractAddress = '0xcontract';
      const mockNfts = [
        {
          id: 'nft-1',
          tokenId: '1',
          contractAddress,
          metadataUrl: 'http://example.com/metadata',
          ownerId: 'wallet-1',
          createdAt: new Date(),
          owner: { user: { profile: { nickname: 'User' } } },
        },
      ];

      mockPrismaService.nFT.findMany.mockResolvedValue(mockNfts);
      mockBlockchainService.isReady.mockReturnValue(false);

      const result = await service.getNftsByContract(contractAddress);

      expect(result.length).toBe(1);
      expect(mockPrismaService.nFT.findMany).toHaveBeenCalledWith({
        where: { contractAddress },
        include: {
          owner: {
            include: {
              user: { include: { profile: true } },
            },
          },
        },
      });
    });
  });

  describe('enrichNftWithMetadata', () => {
    it('should enrich NFT with blockchain metadata when available', async () => {
      const mockNft = {
        id: 'nft-1',
        tokenId: '1',
        contractAddress: '0xcontract',
        metadataUrl: 'http://example.com/metadata',
        ownerId: 'wallet-1',
        createdAt: new Date(),
      };

      mockPrismaService.nFT.findUnique.mockResolvedValue(mockNft);
      mockBlockchainService.isReady.mockReturnValue(true);
      mockBlockchainService.getTokenMetadata.mockResolvedValue({
        tokenType: TokenType.EVENT_ATTENDANCE,
        referenceId: 'event-1',
        mintedAt: new Date(),
      });
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Test Event',
      });

      const result = await service.getNftById('nft-1');

      expect(result.tokenType).toBe('EVENT_ATTENDANCE');
      expect(result.referenceId).toBe('event-1');
      expect(result.event).toBeDefined();
    });

    it('should parse metadata from URL when blockchain not ready', async () => {
      const mockNft = {
        id: 'nft-1',
        tokenId: '1',
        contractAddress: '0xcontract',
        metadataUrl: 'http://example.com/metadata/event/event-123',
        ownerId: 'wallet-1',
        createdAt: new Date(),
      };

      mockPrismaService.nFT.findUnique.mockResolvedValue(mockNft);
      mockBlockchainService.isReady.mockReturnValue(false);
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-123',
        title: 'Test Event',
      });

      const result = await service.getNftById('nft-1');

      expect(result.tokenType).toBe('EVENT_ATTENDANCE');
      expect(result.referenceId).toBe('event-123');
    });
  });
});
