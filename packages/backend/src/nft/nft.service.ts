import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService, TokenType } from '../blockchain/blockchain.service';
import { MintNftDto, MintTokenType } from './dto/mint-nft.dto';

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

  /**
   * Mint SBT as a creator (manual minting)
   */
  async creatorMintNft(creatorId: string, dto: MintNftDto) {
    // Verify creator exists
    const creator = await this.prisma.creator.findUnique({
      where: { userId: creatorId },
    });

    if (!creator) {
      throw new BadRequestException('You are not a registered creator');
    }

    // Check if blockchain service is ready
    if (!this.blockchainService.isReady()) {
      throw new BadRequestException('Blockchain service is not available');
    }

    // Validate recipient address format
    if (!dto.recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new BadRequestException('Invalid wallet address format');
    }

    // Generate metadata URI
    const metadataUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metadata/custom/${creatorId}/${Date.now()}`;

    // Determine blockchain token type
    const blockchainTokenType = dto.tokenType === MintTokenType.EVENT_ATTENDANCE
      ? TokenType.EVENT_ATTENDANCE
      : TokenType.QUEST_COMPLETION;

    // Mint on blockchain
    let mintResult;
    try {
      if (dto.tokenType === MintTokenType.EVENT_ATTENDANCE) {
        mintResult = await this.blockchainService.mintEventAttendance(
          dto.recipientAddress,
          metadataUri,
          dto.referenceId || `custom-${Date.now()}`,
        );
      } else {
        mintResult = await this.blockchainService.mintQuestCompletion(
          dto.recipientAddress,
          metadataUri,
          dto.referenceId || `custom-${Date.now()}`,
        );
      }
    } catch (error) {
      this.logger.error(`Blockchain minting failed: ${error.message}`);
      throw new BadRequestException(`Minting failed: ${error.message}`);
    }

    // Find or create wallet for recipient
    let wallet = await this.prisma.wallet.findUnique({
      where: { address: dto.recipientAddress.toLowerCase() },
    });

    if (!wallet) {
      // Create a placeholder wallet record for tracking
      // Note: This won't be linked to a user until they connect
      const placeholderUser = await this.prisma.user.create({
        data: {
          email: `wallet-${dto.recipientAddress.toLowerCase().slice(0, 10)}@placeholder.local`,
          password: null,
          profile: {
            create: {
              nickname: `Wallet ${dto.recipientAddress.slice(0, 6)}...${dto.recipientAddress.slice(-4)}`,
            },
          },
        },
      });

      wallet = await this.prisma.wallet.create({
        data: {
          address: dto.recipientAddress.toLowerCase(),
          isExternal: true,
          userId: placeholderUser.id,
        },
      });
    }

    // Get creator record
    const creatorRecord = await this.prisma.creator.findUnique({
      where: { userId: creatorId },
    });

    // Save NFT record
    const nft = await this.prisma.nFT.create({
      data: {
        tokenId: mintResult.tokenId,
        contractAddress: this.blockchainService.getContractAddress(),
        metadataUrl: metadataUri,
        tokenType: dto.tokenType === MintTokenType.CUSTOM ? null : dto.tokenType,
        referenceId: dto.referenceId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        transactionHash: mintResult.transactionHash,
        mintedById: creatorRecord?.id,
        ownerId: wallet.id,
      },
    });

    this.logger.log(`Creator ${creatorId} minted SBT: tokenId=${mintResult.tokenId} to ${dto.recipientAddress}`);

    return {
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      blockNumber: mintResult.blockNumber,
      nft,
    };
  }

  /**
   * Get minting history for a creator
   */
  async getCreatorMintingHistory(creatorId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { userId: creatorId },
    });

    if (!creator) {
      return [];
    }

    const nfts = await this.prisma.nFT.findMany({
      where: { mintedById: creator.id },
      include: {
        owner: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return nfts.map((nft) => ({
      id: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      imageUrl: nft.imageUrl,
      tokenType: nft.tokenType,
      referenceId: nft.referenceId,
      transactionHash: nft.transactionHash,
      recipientAddress: nft.owner.address,
      recipientNickname: nft.owner.user?.profile?.nickname,
      mintedAt: nft.createdAt,
    }));
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
                  where: { id: referenceId || undefined },
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
                  where: { id: referenceId || undefined },
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
              where: { id: referenceId || undefined },
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
              where: { id: referenceId || undefined },
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
