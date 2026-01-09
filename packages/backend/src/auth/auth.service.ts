import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

export interface OAuthUser {
  providerId: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'kakao';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private walletService: WalletService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, nickname } = signupDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if nickname exists
    const existingNickname = await this.prisma.profile.findUnique({
      where: { nickname },
    });
    if (existingNickname) {
      throw new ConflictException('Nickname already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create custodial wallet
    const walletData = await this.walletService.createCustodialWallet();

    // Create user with profile and wallet in transaction
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: { nickname },
        },
        wallet: {
          create: {
            address: walletData.address,
            privateKey: walletData.encryptedPrivateKey,
          },
        },
      },
      include: { profile: true, wallet: true },
    });

    return this.generateTokenResponse(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, wallet: true },
    });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenResponse(user);
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true, creator: true },
    });
  }

  async oauthLogin(oauthUser: OAuthUser) {
    const { providerId, email, name, picture, provider } = oauthUser;

    // Check if user exists with this OAuth provider
    let user = await this.prisma.user.findFirst({
      where: {
        provider,
        providerId,
      },
      include: { profile: true, wallet: true },
    });

    if (!user) {
      // Check if email already exists (user registered with email/password)
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true, wallet: true },
      });

      if (existingUser) {
        // Link OAuth to existing account
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            provider,
            providerId,
          },
          include: { profile: true, wallet: true },
        });
      } else {
        // Create new user with OAuth
        const walletData = await this.walletService.createCustodialWallet();

        // Generate unique nickname from name
        let nickname = name.replace(/\s+/g, '_').toLowerCase();
        const existingNickname = await this.prisma.profile.findUnique({
          where: { nickname },
        });
        if (existingNickname) {
          nickname = `${nickname}_${Date.now().toString(36)}`;
        }

        user = await this.prisma.user.create({
          data: {
            email,
            provider,
            providerId,
            profile: {
              create: {
                nickname,
                avatarUrl: picture,
              },
            },
            wallet: {
              create: {
                address: walletData.address,
                privateKey: walletData.encryptedPrivateKey,
              },
            },
          },
          include: { profile: true, wallet: true },
        });
      }
    }

    return this.generateTokenResponse(user);
  }

  private generateTokenResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        walletAddress: user.wallet?.address,
      },
    };
  }
}
