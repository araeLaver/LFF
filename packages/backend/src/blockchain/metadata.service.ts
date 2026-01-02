import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

export interface EventMetadataParams {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  creatorName: string;
  attendeeNickname: string;
}

export interface QuestMetadataParams {
  questId: string;
  questTitle: string;
  completedAt: Date;
  creatorName: string;
  userNickname: string;
  rewardPoints: number;
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.baseUrl =
      configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
  }

  /**
   * Generate metadata for event attendance SBT
   */
  generateEventMetadata(params: EventMetadataParams): NFTMetadata {
    const { eventId, eventTitle, eventDate, creatorName, attendeeNickname } =
      params;

    return {
      name: `${eventTitle} - 참석 증명`,
      description: `${attendeeNickname}님이 ${eventDate.toLocaleDateString('ko-KR')}에 개최된 "${eventTitle}" 이벤트에 참석했음을 증명합니다.`,
      image: `${this.baseUrl}/api/metadata/image/event/${eventId}`,
      external_url: `${this.baseUrl.replace(':3001', ':3000')}/events/${eventId}`,
      attributes: [
        { trait_type: 'Type', value: 'Event Attendance' },
        { trait_type: 'Event', value: eventTitle },
        { trait_type: 'Creator', value: creatorName },
        { trait_type: 'Attendee', value: attendeeNickname },
        {
          trait_type: 'Event Date',
          value: Math.floor(eventDate.getTime() / 1000),
          display_type: 'date',
        },
        {
          trait_type: 'Minted Date',
          value: Math.floor(Date.now() / 1000),
          display_type: 'date',
        },
      ],
    };
  }

  /**
   * Generate metadata for quest completion SBT
   */
  generateQuestMetadata(params: QuestMetadataParams): NFTMetadata {
    const {
      questId,
      questTitle,
      completedAt,
      creatorName,
      userNickname,
      rewardPoints,
    } = params;

    return {
      name: `${questTitle} - 완료 증명`,
      description: `${userNickname}님이 "${questTitle}" 퀘스트를 성공적으로 완료했음을 증명합니다.`,
      image: `${this.baseUrl}/api/metadata/image/quest/${questId}`,
      external_url: `${this.baseUrl.replace(':3001', ':3000')}/quests/${questId}`,
      attributes: [
        { trait_type: 'Type', value: 'Quest Completion' },
        { trait_type: 'Quest', value: questTitle },
        { trait_type: 'Creator', value: creatorName },
        { trait_type: 'Completer', value: userNickname },
        { trait_type: 'Reward Points', value: rewardPoints },
        {
          trait_type: 'Completed Date',
          value: Math.floor(completedAt.getTime() / 1000),
          display_type: 'date',
        },
        {
          trait_type: 'Minted Date',
          value: Math.floor(Date.now() / 1000),
          display_type: 'date',
        },
      ],
    };
  }

  /**
   * Store metadata in database and return URI
   */
  async storeMetadata(
    tokenType: 'event' | 'quest',
    referenceId: string,
    metadata: NFTMetadata,
  ): Promise<string> {
    // Store in NFTMetadata table (we'll create this)
    // For now, just return the API endpoint URL
    const metadataUri = `${this.baseUrl}/api/metadata/${tokenType}/${referenceId}`;
    this.logger.log(`Metadata URI generated: ${metadataUri}`);
    return metadataUri;
  }

  /**
   * Get event metadata by eventId and userId
   */
  async getEventMetadata(
    eventId: string,
    userId: string,
  ): Promise<NFTMetadata | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!event || !user) return null;

    return this.generateEventMetadata({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      creatorName: event.creator.user.profile?.nickname || 'Unknown Creator',
      attendeeNickname: user.profile?.nickname || 'Unknown User',
    });
  }

  /**
   * Get quest metadata by questId and userId
   */
  async getQuestMetadata(
    questId: string,
    userId: string,
  ): Promise<NFTMetadata | null> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!quest || !user) return null;

    return this.generateQuestMetadata({
      questId: quest.id,
      questTitle: quest.title,
      completedAt: new Date(),
      creatorName: quest.creator.user.profile?.nickname || 'Unknown Creator',
      userNickname: user.profile?.nickname || 'Unknown User',
      rewardPoints: quest.rewardPoints,
    });
  }
}
