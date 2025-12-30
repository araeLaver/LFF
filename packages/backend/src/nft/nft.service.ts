import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NftService {
  constructor(private prisma: PrismaService) {}

  async getUserNfts(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { nfts: true },
    });
    return wallet?.nfts || [];
  }

  async getNftById(id: string) {
    const nft = await this.prisma.nFT.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
    if (!nft) throw new NotFoundException('NFT not found');
    return nft;
  }

  async getNftByTokenId(tokenId: string) {
    const nft = await this.prisma.nFT.findUnique({
      where: { tokenId },
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
    if (!nft) throw new NotFoundException('NFT not found');
    return nft;
  }

  // This would integrate with blockchain service for actual minting
  async mintNft(
    ownerId: string,
    tokenId: string,
    contractAddress: string,
    metadataUrl: string,
  ) {
    return this.prisma.nFT.create({
      data: {
        tokenId,
        contractAddress,
        metadataUrl,
        ownerId,
      },
    });
  }

  async getAllNfts() {
    return this.prisma.nFT.findMany({
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }

  async getNftsByContract(contractAddress: string) {
    return this.prisma.nFT.findMany({
      where: { contractAddress },
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }
}
