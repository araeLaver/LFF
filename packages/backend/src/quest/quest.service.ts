import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { SubmitQuestDto } from './dto/submit-quest.dto';
import { SubmissionStatus } from '@prisma/client';

@Injectable()
export class QuestService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.questSubmission.update({
      where: { id: submissionId },
      data: { status },
    });
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
