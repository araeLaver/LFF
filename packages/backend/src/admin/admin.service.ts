import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const [
      totalUsers,
      totalCreators,
      totalQuests,
      totalEvents,
      totalNfts,
      totalGatedContent,
      recentUsers,
      pendingSubmissions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.creator.count(),
      this.prisma.quest.count(),
      this.prisma.event.count(),
      this.prisma.nFT.count(),
      this.prisma.gatedContent.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.questSubmission.count({
        where: { status: 'PENDING' },
      }),
    ]);

    return {
      totalUsers,
      totalCreators,
      totalQuests,
      totalEvents,
      totalNfts,
      totalGatedContent,
      recentUsers,
      pendingSubmissions,
    };
  }

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { profile: { nickname: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          wallet: true,
          creator: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        provider: user.provider,
        nickname: user.profile?.nickname,
        avatarUrl: user.profile?.avatarUrl,
        hasWallet: !!user.wallet,
        isCreator: !!user.creator,
        createdAt: user.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If promoting to CREATOR, ensure creator profile exists
    if (role === 'CREATOR') {
      const existingCreator = await this.prisma.creator.findUnique({
        where: { userId },
      });

      if (!existingCreator) {
        await this.prisma.creator.create({
          data: { userId },
        });
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { profile: true },
    });
  }

  /**
   * Get all quests for moderation
   */
  async getQuestsForModeration(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [quests, total] = await Promise.all([
      this.prisma.quest.findMany({
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
          _count: { select: { submissions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quest.count(),
    ]);

    return {
      quests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete a quest
   */
  async deleteQuest(questId: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    // Delete submissions first
    await this.prisma.questSubmission.deleteMany({
      where: { questId },
    });

    return this.prisma.quest.delete({
      where: { id: questId },
    });
  }

  /**
   * Get all events for moderation
   */
  async getEventsForModeration(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
          _count: { select: { qrcodes: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.count(),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Delete QR redemptions first
    await this.prisma.qRCodeRedemption.deleteMany({
      where: { qrcode: { eventId } },
    });

    // Delete QR codes
    await this.prisma.qRCode.deleteMany({
      where: { eventId },
    });

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  /**
   * Get all gated content for moderation
   */
  async getGatedContentForModeration(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      this.prisma.gatedContent.findMany({
        include: {
          creator: {
            include: {
              user: { include: { profile: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gatedContent.count(),
    ]);

    return {
      contents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete gated content
   */
  async deleteGatedContent(contentId: string) {
    const content = await this.prisma.gatedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Gated content not found');
    }

    return this.prisma.gatedContent.delete({
      where: { id: contentId },
    });
  }

  /**
   * Get all creators
   */
  async getCreators(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [creators, total] = await Promise.all([
      this.prisma.creator.findMany({
        include: {
          user: { include: { profile: true } },
          _count: {
            select: {
              quests: true,
              events: true,
              gatedContent: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.creator.count(),
    ]);

    return {
      creators: creators.map((c) => ({
        id: c.id,
        userId: c.userId,
        email: c.user.email,
        nickname: c.user.profile?.nickname,
        avatarUrl: c.user.profile?.avatarUrl,
        questsCount: c._count.quests,
        eventsCount: c._count.events,
        gatedContentCount: c._count.gatedContent,
        createdAt: c.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
