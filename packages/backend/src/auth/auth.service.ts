import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
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
    private emailService: EmailService,
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
        provider: 'local',
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

    // Send verification email
    await this.sendVerificationEmail(user.id, email);

    return this.generateTokenResponse(user);
  }

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Delete any existing verification tokens for this user
    await this.prisma.emailVerification.deleteMany({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: {
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
        userId,
      },
    });

    await this.emailService.sendVerificationEmail(email, token);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.emailVerification.delete({ where: { id: verification.id } });
      throw new BadRequestException('Verification token has expired');
    }

    if (verification.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestException('Invalid token type');
    }

    // Update user and delete token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.delete({ where: { id: verification.id } }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(userId, user.email);

    return { message: 'Verification email sent' };
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
            emailVerified: true, // OAuth users are automatically verified
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

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    // OAuth-only users cannot reset password
    if (!user.password && user.provider !== 'local') {
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    // Delete any existing password reset tokens
    await this.prisma.emailVerification.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
      },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.emailVerification.create({
      data: {
        token,
        type: 'PASSWORD_RESET',
        expiresAt,
        userId: user.id,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'If an account exists, a password reset email has been sent' };
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return { valid: false };
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.emailVerification.delete({ where: { id: verification.id } });
      return { valid: false };
    }

    if (verification.type !== 'PASSWORD_RESET') {
      return { valid: false };
    }

    return { valid: true, email: verification.user.email };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.emailVerification.delete({ where: { id: verification.id } });
      throw new BadRequestException('Reset token has expired');
    }

    if (verification.type !== 'PASSWORD_RESET') {
      throw new BadRequestException('Invalid token type');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.emailVerification.delete({ where: { id: verification.id } }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  private generateTokenResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        profile: user.profile,
        walletAddress: user.wallet?.address,
      },
    };
  }
}
