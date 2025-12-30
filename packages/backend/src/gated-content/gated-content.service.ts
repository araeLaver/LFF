import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGatedContentDto } from './dto/create-gated-content.dto';
import { UpdateGatedContentDto } from './dto/update-gated-content.dto';

@Injectable()
export class GatedContentService {
  constructor(private prisma: PrismaService) {}

  async createContent(creatorId: string, dto: CreateGatedContentDto) {
    return this.prisma.gatedContent.create({
      data: {
        title: dto.title,
        content: dto.content,
        requiredNftId: dto.requiredNftId,
        creatorId,
      },
    });
  }

  async findAllContent() {
    return this.prisma.gatedContent.findMany({
      select: {
        id: true,
        title: true,
        requiredNftId: true,
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
        createdAt: true,
        // Exclude actual content for listing
      },
    });
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

    // If no NFT required, return content
    if (!content.requiredNftId) {
      return content;
    }

    // Verify user owns the required NFT
    const userWallet = await this.prisma.wallet.findFirst({
      where: { userId },
      include: { nfts: true },
    });

    const ownsRequiredNft = userWallet?.nfts.some(
      (nft) => nft.id === content.requiredNftId,
    );

    if (!ownsRequiredNft) {
      throw new ForbiddenException(
        'You do not own the required NFT to access this content',
      );
    }

    return content;
  }

  async getContentPreview(contentId: string) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
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

  async getCreatorContent(creatorId: string) {
    return this.prisma.gatedContent.findMany({
      where: { creatorId },
      include: { requiredNft: true },
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

  async checkAccess(contentId: string, userId: string): Promise<boolean> {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) throw new NotFoundException('Content not found');

    // If no NFT required, access granted
    if (!content.requiredNftId) {
      return true;
    }

    // Verify user owns the required NFT
    const userWallet = await this.prisma.wallet.findFirst({
      where: { userId },
      include: { nfts: true },
    });

    return userWallet?.nfts.some((nft) => nft.id === content.requiredNftId) || false;
  }
}
