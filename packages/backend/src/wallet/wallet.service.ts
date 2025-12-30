import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>(
      'WALLET_ENCRYPTION_KEY',
    )!;
  }

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
