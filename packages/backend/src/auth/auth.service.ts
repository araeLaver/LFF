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

    if (!user || !(await bcrypt.compare(password, user.password))) {
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
