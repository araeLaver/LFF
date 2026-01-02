import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, TokenType } from '../blockchain/blockchain.service';

export interface NFTWithMetadata {
  id: string;
  tokenId: string;
  contractAddress: string;
  metadataUrl: string;
  ownerId: string;
  createdAt: Date;
  // On-chain metadata
  tokenType: 'EVENT_ATTENDANCE' | 'QUEST_COMPLETION' | null;
  referenceId: string | null;
  mintedAt: Date | null;
  // Related data
  event?: any;
  quest?: any;
}

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async getUserNfts(userId: string): Promise<NFTWithMetadata[]> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { nfts: true },
    });

    if (!wallet?.nfts || wallet.nfts.length === 0) {
      return [];
    }

    // Enrich NFTs with blockchain metadata
    const enrichedNfts = await Promise.all(
      wallet.nfts.map(async (nft) => this.enrichNftWithMetadata(nft)),
    );

    return enrichedNfts;
  }

  async getNftById(id: string): Promise<NFTWithMetadata> {
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
    return this.enrichNftWithMetadata(nft);
  }

  async getNftByTokenId(tokenId: string): Promise<NFTWithMetadata> {
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
    return this.enrichNftWithMetadata(nft);
  }

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

  async getAllNfts(): Promise<NFTWithMetadata[]> {
    const nfts = await this.prisma.nFT.findMany({
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    return Promise.all(nfts.map((nft) => this.enrichNftWithMetadata(nft)));
  }

  async getNftsByContract(contractAddress: string): Promise<NFTWithMetadata[]> {
    const nfts = await this.prisma.nFT.findMany({
      where: { contractAddress },
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    return Promise.all(nfts.map((nft) => this.enrichNftWithMetadata(nft)));
  }

  /**
   * Enrich NFT with on-chain metadata and related data
   */
  private async enrichNftWithMetadata(nft: any): Promise<NFTWithMetadata> {
    let tokenType: 'EVENT_ATTENDANCE' | 'QUEST_COMPLETION' | null = null;
    let referenceId: string | null = null;
    let mintedAt: Date | null = null;
    let event = null;
    let quest = null;

    // Try to get on-chain metadata
    if (this.blockchainService.isReady()) {
      try {
        const metadata = await this.blockchainService.getTokenMetadata(
          nft.tokenId,
        );
        if (metadata) {
          tokenType =
            metadata.tokenType === TokenType.EVENT_ATTENDANCE
              ? 'EVENT_ATTENDANCE'
              : 'QUEST_COMPLETION';
          referenceId = metadata.referenceId;
          mintedAt = metadata.mintedAt;

          // Fetch related event or quest
          if (referenceId) {
            if (tokenType === 'EVENT_ATTENDANCE') {
              event = await this.prisma.event
                .findUnique({
                  where: { id: referenceId },
                  include: {
                    creator: {
                      include: { user: { include: { profile: true } } },
                    },
                  },
                })
                .catch(() => null);
            } else {
              quest = await this.prisma.quest
                .findUnique({
                  where: { id: referenceId },
                  include: {
                    creator: {
                      include: { user: { include: { profile: true } } },
                    },
                  },
                })
                .catch(() => null);
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get on-chain metadata for token ${nft.tokenId}: ${error.message}`,
        );
      }
    }

    // If blockchain is not ready, try to parse from metadataUrl
    if (!tokenType && nft.metadataUrl) {
      const urlMatch = nft.metadataUrl.match(
        /\/metadata\/(event|quest)\/([^/]+)/,
      );
      if (urlMatch) {
        tokenType =
          urlMatch[1] === 'event' ? 'EVENT_ATTENDANCE' : 'QUEST_COMPLETION';
        referenceId = urlMatch[2];

        // Fetch related data
        if (tokenType === 'EVENT_ATTENDANCE') {
          event = await this.prisma.event
            .findUnique({
              where: { id: referenceId },
              include: {
                creator: {
                  include: { user: { include: { profile: true } } },
                },
              },
            })
            .catch(() => null);
        } else {
          quest = await this.prisma.quest
            .findUnique({
              where: { id: referenceId },
              include: {
                creator: {
                  include: { user: { include: { profile: true } } },
                },
              },
            })
            .catch(() => null);
        }
      }
    }

    return {
      id: nft.id,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      metadataUrl: nft.metadataUrl,
      ownerId: nft.ownerId,
      createdAt: nft.createdAt,
      tokenType,
      referenceId,
      mintedAt: mintedAt || nft.createdAt,
      event,
      quest,
    };
  }
}
