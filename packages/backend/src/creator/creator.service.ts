import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CreatorService {
  constructor(private prisma: PrismaService) {}

  async becomeCreator(userId: string) {
    const existingCreator = await this.prisma.creator.findUnique({
      where: { userId },
    });

    if (existingCreator) {
      throw new ConflictException('User is already a creator');
    }

    const [creator] = await this.prisma.$transaction([
      this.prisma.creator.create({
        data: { userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.CREATOR },
      }),
    ]);

    return creator;
  }

  async getCreatorProfile(creatorId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        user: { include: { profile: true } },
        quests: true,
        gatedContent: true,
        events: true,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }

  async getCreatorByUserId(userId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { userId },
      include: {
        user: { include: { profile: true } },
        quests: true,
        gatedContent: true,
        events: true,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }

  async getAllCreators() {
    return this.prisma.creator.findMany({
      include: {
        user: { include: { profile: true } },
      },
    });
  }
}
