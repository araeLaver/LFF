import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private encryptionKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'WALLET_ENCRYPTION_KEY',
    )!;
  }

  // Generate a nonce message for wallet signature verification
  generateNonceMessage(nonce: string): string {
    return `Sign this message to verify your wallet ownership.\n\nNonce: ${nonce}`;
  }

  // Generate a random nonce
  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Verify wallet signature
  verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  // Link external wallet to user
  async linkExternalWallet(
    userId: string,
    address: string,
    signature: string,
    message: string,
    chainId?: number,
  ) {
    // Verify the signature
    if (!this.verifySignature(message, signature, address)) {
      throw new BadRequestException('Invalid signature');
    }

    // Check if user already has a wallet
    const existingUserWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existingUserWallet) {
      throw new ConflictException('User already has a linked wallet');
    }

    // Check if wallet address is already used by another user
    const existingAddressWallet = await this.prisma.wallet.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (existingAddressWallet) {
      throw new ConflictException('Wallet address is already linked to another account');
    }

    // Create wallet link
    const wallet = await this.prisma.wallet.create({
      data: {
        address: address.toLowerCase(),
        isExternal: true,
        chainId,
        userId,
      },
    });

    return wallet;
  }

  // Unlink wallet from user
  async unlinkWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('No wallet linked to this account');
    }

    await this.prisma.wallet.delete({
      where: { id: wallet.id },
    });

    return { success: true, message: 'Wallet unlinked successfully' };
  }

  // Get user's wallet
  async getUserWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        nfts: true,
      },
    });

    return wallet;
  }

  // Create custodial wallet for user
  async createCustodialWallet(): Promise<{
    address: string;
    encryptedPrivateKey: string;
  }> {
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    return {
      address: wallet.address,
      encryptedPrivateKey,
    };
  }

  private encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv,
    );
    let encrypted = cipher.update(privateKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decryptPrivateKey(encryptedPrivateKey: string): string {
    const parts = encryptedPrivateKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
