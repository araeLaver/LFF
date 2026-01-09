import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MetadataService } from '../blockchain/metadata.service';
import { NotificationService } from '../notification/notification.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { SubmitQuestDto } from './dto/submit-quest.dto';
import { SubmissionStatus } from '@prisma/client';

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private metadataService: MetadataService,
    private notificationService: NotificationService,
  ) {}

  async createQuest(creatorId: string, dto: CreateQuestDto) {
    return this.prisma.quest.create({
      data: {
        ...dto,
        creatorId,
      },
    });
  }

  async findAllQuests() {
    return this.prisma.quest.findMany({
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }

  async findQuestById(id: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
        submissions: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
    if (!quest) throw new NotFoundException('Quest not found');
    return quest;
  }

  async findCreatorQuests(creatorId: string) {
    return this.prisma.quest.findMany({
      where: { creatorId },
      include: {
        submissions: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });
  }

  async updateQuest(questId: string, creatorId: string, dto: UpdateQuestDto) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) throw new NotFoundException('Quest not found');
    if (quest.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to update this quest');
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: dto,
    });
  }

  async deleteQuest(questId: string, creatorId: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) throw new NotFoundException('Quest not found');
    if (quest.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to delete this quest');
    }

    return this.prisma.quest.delete({
      where: { id: questId },
    });
  }

  async submitQuest(userId: string, questId: string, dto: SubmitQuestDto) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });
    if (!quest) throw new NotFoundException('Quest not found');

    return this.prisma.questSubmission.create({
      data: {
        userId,
        questId,
        proofUrl: dto.proofUrl,
        status: SubmissionStatus.PENDING,
      },
    });
  }

  async reviewSubmission(
    creatorId: string,
    submissionId: string,
    status: SubmissionStatus,
  ) {
    const submission = await this.prisma.questSubmission.findUnique({
      where: { id: submissionId },
      include: { quest: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.quest.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to review this submission');
    }

    const updatedSubmission = await this.prisma.questSubmission.update({
      where: { id: submissionId },
      data: { status },
      include: { quest: true, user: true },
    });

    // Mint SBT when submission is approved
    let mintResult = null;
    if (status === SubmissionStatus.APPROVED && this.blockchainService.isReady()) {
      try {
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId: submission.userId },
        });

        if (wallet) {
          const metadataUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metadata/quest/${submission.questId}/${submission.userId}`;

          mintResult = await this.blockchainService.mintQuestCompletion(
            wallet.address,
            metadataUri,
            submission.questId,
          );

          this.logger.log(
            `Quest SBT minted for user ${submission.userId}: tokenId=${mintResult.tokenId}`,
          );

          await this.prisma.nFT.create({
            data: {
              tokenId: mintResult.tokenId,
              contractAddress: this.blockchainService.getContractAddress(),
              metadataUrl: metadataUri,
              tokenType: 'QUEST_COMPLETION',
              referenceId: submission.questId,
              name: `Quest: ${submission.quest.title}`,
              description: `Completed quest "${submission.quest.title}"`,
              ownerId: wallet.id,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to mint quest SBT: ${error.message}`);
      }
    }

    // Send notification
    if (status === SubmissionStatus.APPROVED) {
      await this.notificationService.notifyQuestApproved(
        submission.userId,
        submission.quest.title,
        submission.questId,
      );
    } else if (status === SubmissionStatus.REJECTED) {
      await this.notificationService.notifyQuestRejected(
        submission.userId,
        submission.quest.title,
        submission.questId,
      );
    }

    return { submission: updatedSubmission, mintResult };
  }

  async getUserSubmissions(userId: string) {
    return this.prisma.questSubmission.findMany({
      where: { userId },
      include: {
        quest: {
          include: {
            creator: {
              include: {
                user: { include: { profile: true } },
              },
            },
          },
        },
      },
    });
  }

  async getSubmissionsByQuest(questId: string, creatorId: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) throw new NotFoundException('Quest not found');
    if (quest.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to view these submissions');
    }

    return this.prisma.questSubmission.findMany({
      where: { questId },
      include: {
        user: { include: { profile: true } },
      },
    });
  }
}
