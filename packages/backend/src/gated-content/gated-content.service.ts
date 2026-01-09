import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateGatedContentDto } from './dto/create-gated-content.dto';
import { UpdateGatedContentDto } from './dto/update-gated-content.dto';

@Injectable()
export class GatedContentService {
  private readonly logger = new Logger(GatedContentService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  async createContent(creatorId: string, dto: CreateGatedContentDto) {
    return this.prisma.gatedContent.create({
      data: {
        title: dto.title,
        description: dto.description,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        previewUrl: dto.previewUrl,
        requiredNftContract: dto.requiredNftContract,
        requiredTokenId: dto.requiredTokenId,
        requiredNftId: dto.requiredNftId,
        status: dto.status || 'PUBLISHED',
        creatorId,
      },
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }

  async findAllContent() {
    return this.prisma.gatedContent.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        previewUrl: true,
        requiredNftContract: true,
        requiredTokenId: true,
        requiredNftId: true,
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
        createdAt: true,
        // Exclude actual contentUrl for listing
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContentPreview(contentId: string) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        previewUrl: true,
        requiredNftContract: true,
        requiredTokenId: true,
        requiredNftId: true,
        requiredNft: true,
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
        createdAt: true,
      },
    });

    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async getContent(contentId: string, userId: string) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
      include: {
        requiredNft: true,
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    if (!content) throw new NotFoundException('Content not found');

    // Check access
    const hasAccess = await this.checkAccessInternal(content, userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have the required NFT to access this content',
      );
    }

    return content;
  }

  async getContentAccess(contentId: string, userId: string) {
    const content = await this.getContent(contentId, userId);

    // Return the content URL for access
    return {
      accessUrl: content.contentUrl,
      contentType: content.contentType,
      title: content.title,
    };
  }

  private async checkAccessInternal(content: any, userId: string): Promise<boolean> {
    // If no NFT required, access granted
    if (!content.requiredNftContract && !content.requiredNftId) {
      return true;
    }

    // Get user's wallet
    const userWallet = await this.prisma.wallet.findFirst({
      where: { userId },
      include: { nfts: true },
    });

    if (!userWallet) return false;

    // Check by contract address with on-chain verification
    if (content.requiredNftContract) {
      // First, try on-chain verification for external wallets
      if (userWallet.isExternal && this.blockchainService.isReady()) {
        try {
          const hasOnChain = await this.blockchainService.checkNFTOwnership(
            content.requiredNftContract,
            userWallet.address,
            content.requiredTokenId || undefined,
          );
          if (hasOnChain) {
            this.logger.log(`On-chain NFT ownership verified for user ${userId}`);
            return true;
          }
        } catch (error) {
          this.logger.warn(`On-chain verification failed: ${error.message}`);
        }
      }

      // Fallback to database check (for platform-minted NFTs)
      const hasNftFromContract = userWallet.nfts.some(nft => {
        // Match contract address
        if (nft.contractAddress.toLowerCase() !== content.requiredNftContract.toLowerCase()) {
          return false;
        }
        // If specific token ID required, check that too
        if (content.requiredTokenId) {
          return nft.tokenId === content.requiredTokenId;
        }
        return true;
      });

      if (hasNftFromContract) return true;
    }

    // Check by specific NFT ID (legacy support)
    if (content.requiredNftId) {
      return userWallet.nfts.some(nft => nft.id === content.requiredNftId);
    }

    return false;
  }

  async checkAccess(contentId: string, userId: string): Promise<{ hasAccess: boolean; reason?: string }> {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
      include: { requiredNft: true },
    });

    if (!content) throw new NotFoundException('Content not found');

    const hasAccess = await this.checkAccessInternal(content, userId);

    if (hasAccess) {
      return { hasAccess: true };
    }

    // Provide reason for no access
    let reason = 'You need to own a specific NFT to access this content';
    if (content.requiredNftContract) {
      reason = `You need an NFT from contract ${content.requiredNftContract}`;
      if (content.requiredTokenId) {
        reason += ` with token ID ${content.requiredTokenId}`;
      }
    }

    return { hasAccess: false, reason };
  }

  async getCreatorContent(creatorId: string) {
    return this.prisma.gatedContent.findMany({
      where: { creatorId },
      include: { requiredNft: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateContent(
    contentId: string,
    creatorId: string,
    dto: UpdateGatedContentDto,
  ) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) throw new NotFoundException('Content not found');
    if (content.creatorId !== creatorId) {
      throw new ForbiddenException('Not your content');
    }

    return this.prisma.gatedContent.update({
      where: { id: contentId },
      data: dto,
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }

  async deleteContent(contentId: string, creatorId: string) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) throw new NotFoundException('Content not found');
    if (content.creatorId !== creatorId) {
      throw new ForbiddenException('Not your content');
    }

    return this.prisma.gatedContent.delete({
      where: { id: contentId },
    });
  }
}
