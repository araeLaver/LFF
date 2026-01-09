import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let walletService: WalletService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockWalletService = {
    createCustodialWallet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    walletService = module.get<WalletService>(WalletService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user with profile when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'USER',
        profile: { nickname: 'TestUser' },
        wallet: { address: '0x123' },
        creator: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { profile: true, wallet: true, creator: true },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashedPassword',
        role: 'USER',
        profile: { nickname: 'TestUser' },
        wallet: { address: '0x123' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'USER',
          profile: { nickname: 'TestUser' },
          walletAddress: '0x123',
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashedPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no password (OAuth user)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        password: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signup', () => {
    it('should create a new user with profile and wallet', async () => {
      const signupDto = {
        email: 'new@test.com',
        password: 'password123',
        nickname: 'NewUser',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockWalletService.createCustodialWallet.mockResolvedValue({
        address: '0xnew',
        encryptedPrivateKey: 'encrypted',
      });

      const createdUser = {
        id: 'new-user-1',
        email: 'new@test.com',
        role: 'USER',
        profile: { nickname: 'NewUser' },
        wallet: { address: '0xnew' },
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.signup(signupDto);

      expect(result.accessToken).toBe('new-jwt-token');
      expect(result.user.email).toBe('new@test.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockWalletService.createCustodialWallet).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const signupDto = {
        email: 'existing@test.com',
        password: 'password123',
        nickname: 'NewUser',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when nickname already exists', async () => {
      const signupDto = {
        email: 'new@test.com',
        password: 'password123',
        nickname: 'ExistingNick',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.profile.findUnique.mockResolvedValue({ id: 'existing-profile' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('oauthLogin', () => {
    const oauthUser = {
      providerId: 'google-123',
      email: 'oauth@test.com',
      name: 'OAuth User',
      picture: 'https://example.com/pic.jpg',
      provider: 'google' as const,
    };

    it('should return token for existing OAuth user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'oauth@test.com',
        role: 'USER',
        profile: { nickname: 'OAuthUser' },
        wallet: { address: '0x123' },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('oauth-jwt-token');

      const result = await service.oauthLogin(oauthUser);

      expect(result.accessToken).toBe('oauth-jwt-token');
      expect(result.user.email).toBe('oauth@test.com');
    });

    it('should create new user for new OAuth login', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      mockWalletService.createCustodialWallet.mockResolvedValue({
        address: '0xnew',
        encryptedPrivateKey: 'encrypted',
      });

      const createdUser = {
        id: 'new-user-1',
        email: 'oauth@test.com',
        role: 'USER',
        profile: { nickname: 'oauth_user' },
        wallet: { address: '0xnew' },
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('new-oauth-jwt');

      const result = await service.oauthLogin(oauthUser);

      expect(result.accessToken).toBe('new-oauth-jwt');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should link OAuth to existing email/password user', async () => {
      const existingUser = {
        id: 'existing-1',
        email: 'oauth@test.com',
        role: 'USER',
        profile: { nickname: 'ExistingUser' },
        wallet: { address: '0x123' },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        provider: 'google',
        providerId: 'google-123',
      });
      mockJwtService.sign.mockReturnValue('linked-jwt');

      const result = await service.oauthLogin(oauthUser);

      expect(result.accessToken).toBe('linked-jwt');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });
});
