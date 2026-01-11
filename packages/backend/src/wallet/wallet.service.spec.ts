import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;

  const mockEncryptionKey = '12345678901234567890123456789012'; // 32 bytes

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(mockEncryptionKey),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateNonceMessage', () => {
    it('should generate a message with nonce', () => {
      const nonce = 'test-nonce-123';
      const message = service.generateNonceMessage(nonce);

      expect(message).toContain(nonce);
      expect(message).toContain('Sign this message');
    });
  });

  describe('generateNonce', () => {
    it('should generate a random hex string', () => {
      const nonce1 = service.generateNonce();
      const nonce2 = service.generateNonce();

      expect(nonce1).toMatch(/^[a-f0-9]+$/);
      expect(nonce1.length).toBe(64); // 32 bytes = 64 hex chars
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('verifySignature', () => {
    it('should return false for invalid signature', () => {
      const result = service.verifySignature(
        'message',
        'invalid-signature',
        '0x1234567890abcdef1234567890abcdef12345678',
      );

      expect(result).toBe(false);
    });
  });

  describe('linkExternalWallet', () => {
    const userId = 'user-1';
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const signature = 'invalid-signature';
    const message = 'Sign this message';

    it('should throw BadRequestException for invalid signature', async () => {
      await expect(
        service.linkExternalWallet(userId, address, signature, message),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user already has wallet', async () => {
      // We need to mock verifySignature to return true for this test
      jest.spyOn(service, 'verifySignature').mockReturnValue(true);
      mockPrismaService.wallet.findUnique.mockResolvedValueOnce({
        id: 'existing',
        userId,
      });

      await expect(
        service.linkExternalWallet(userId, address, signature, message),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when address already linked', async () => {
      jest.spyOn(service, 'verifySignature').mockReturnValue(true);
      mockPrismaService.wallet.findUnique
        .mockResolvedValueOnce(null) // First call: check user wallet
        .mockResolvedValueOnce({ id: 'existing' }); // Second call: check address

      await expect(
        service.linkExternalWallet(userId, address, signature, message),
      ).rejects.toThrow(ConflictException);
    });

    it('should link external wallet successfully when valid', async () => {
      jest.spyOn(service, 'verifySignature').mockReturnValue(true);
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue({
        id: 'wallet-1',
        address: address.toLowerCase(),
        userId,
        isExternal: true,
      });

      const result = await service.linkExternalWallet(
        userId,
        address,
        signature,
        message,
        1,
      );

      expect(result.address).toBe(address.toLowerCase());
      expect(result.isExternal).toBe(true);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: {
          address: address.toLowerCase(),
          isExternal: true,
          chainId: 1,
          userId,
        },
      });
    });
  });

  describe('unlinkWallet', () => {
    it('should unlink wallet successfully', async () => {
      const userId = 'user-1';
      const mockWallet = { id: 'wallet-1', userId };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.wallet.delete.mockResolvedValue(mockWallet);

      const result = await service.unlinkWallet(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Wallet unlinked successfully');
      expect(mockPrismaService.wallet.delete).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
      });
    });

    it('should throw NotFoundException when no wallet exists', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.unlinkWallet('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserWallet', () => {
    it('should return wallet with NFTs', async () => {
      const mockWallet = {
        id: 'wallet-1',
        address: '0x123',
        nfts: [{ id: 'nft-1', tokenId: '1' }],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getUserWallet('user-1');

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { nfts: true },
      });
    });

    it('should return null when wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getUserWallet('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createCustodialWallet', () => {
    it('should create a new custodial wallet with address and encrypted key', async () => {
      const result = await service.createCustodialWallet();

      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.encryptedPrivateKey).toBeDefined();
      expect(result.encryptedPrivateKey).toContain(':'); // IV:encrypted format
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt private key correctly', async () => {
      const result = await service.createCustodialWallet();
      const decrypted = service.decryptPrivateKey(result.encryptedPrivateKey);

      // The decrypted key should be a valid private key format
      expect(decrypted).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });
});
