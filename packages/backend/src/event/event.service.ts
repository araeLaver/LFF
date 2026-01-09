import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MetadataService } from '../blockchain/metadata.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private metadataService: MetadataService,
  ) {}

  async createEvent(creatorId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        eventDate: new Date(dto.eventDate),
        creatorId,
      },
    });
  }

  async findAllEvents() {
    return this.prisma.event.findMany({
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async findEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: { include: { profile: true } },
          },
        },
        qrcodes: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async updateEvent(eventId: string, creatorId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to update this event');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...dto,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
    });
  }

  async deleteEvent(eventId: string, creatorId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to delete this event');
    }

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async generateQRCode(eventId: string, creatorId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to generate QR for this event');
    }

    const code = uuidv4();
    const qrcode = await this.prisma.qRCode.create({
      data: {
        code,
        eventId,
      },
    });

    // Generate QR code image as base64
    const qrImage = await QRCode.toDataURL(code);

    return {
      qrcode,
      qrImage,
    };
  }

  async redeemQRCode(userId: string, code: string) {
    const qrcode = await this.prisma.qRCode.findUnique({
      where: { code },
      include: { event: true },
    });

    if (!qrcode) throw new NotFoundException('QR code not found');
    if (!qrcode.isActive) {
      throw new ConflictException('QR code is no longer active');
    }

    // Check if user already redeemed this QR code
    const existingRedemption = await this.prisma.qRCodeRedemption.findUnique({
      where: {
        userRedeemedOnce: {
          qrCodeId: qrcode.id,
          userId,
        },
      },
    });

    if (existingRedemption) {
      throw new ConflictException('You have already redeemed this QR code');
    }

    // Create redemption
    const redemption = await this.prisma.qRCodeRedemption.create({
      data: {
        qrCodeId: qrcode.id,
        userId,
      },
      include: {
        qrcode: { include: { event: true } },
      },
    });

    // Mint SBT for event attendance
    let mintResult = null;
    if (this.blockchainService.isReady()) {
      try {
        // Get user's wallet address
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId },
        });

        if (wallet) {
          // Generate metadata URI
          const metadataUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metadata/event/${qrcode.eventId}/${userId}`;

          // Mint SBT
          mintResult = await this.blockchainService.mintEventAttendance(
            wallet.address,
            metadataUri,
            qrcode.eventId,
          );

          this.logger.log(
            `SBT minted for user ${userId}: tokenId=${mintResult.tokenId}`,
          );

          // Save NFT record in database
          await this.prisma.nFT.create({
            data: {
              tokenId: mintResult.tokenId,
              contractAddress: this.blockchainService.getContractAddress(),
              metadataUrl: metadataUri,
              tokenType: 'EVENT_ATTENDANCE',
              referenceId: qrcode.eventId,
              name: `Event: ${qrcode.event.title}`,
              description: `Attended "${qrcode.event.title}" on ${qrcode.event.eventDate.toLocaleDateString()}`,
              ownerId: wallet.id,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to mint SBT: ${error.message}`);
        // Don't fail the redemption if minting fails
      }
    } else {
      this.logger.warn('Blockchain service not initialized, skipping SBT mint');
    }

    return {
      message: 'QR code redeemed successfully',
      event: qrcode.event,
      redemption,
      mintResult,
    };
  }

  async getCreatorEvents(creatorId: string) {
    return this.prisma.event.findMany({
      where: { creatorId },
      include: {
        qrcodes: {
          include: {
            redemptions: {
              include: {
                user: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async deactivateQRCode(qrCodeId: string, creatorId: string) {
    const qrcode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: { event: true },
    });

    if (!qrcode) throw new NotFoundException('QR code not found');
    if (qrcode.event.creatorId !== creatorId) {
      throw new ForbiddenException('Not authorized to deactivate this QR code');
    }

    return this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: { isActive: false },
    });
  }
}
