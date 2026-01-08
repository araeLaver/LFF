import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { MetadataService, NFTMetadata } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(
    private metadataService: MetadataService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get metadata for event attendance SBT
   * URL: /api/metadata/event/:eventId/:userId
   */
  @Get('event/:eventId/:userId')
  async getEventMetadata(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ): Promise<NFTMetadata> {
    const metadata = await this.metadataService.getEventMetadata(
      eventId,
      userId,
    );
    if (!metadata) {
      throw new NotFoundException('Event or user not found');
    }
    return metadata;
  }

  /**
   * Get metadata for quest completion SBT
   * URL: /api/metadata/quest/:questId/:userId
   */
  @Get('quest/:questId/:userId')
  async getQuestMetadata(
    @Param('questId') questId: string,
    @Param('userId') userId: string,
  ): Promise<NFTMetadata> {
    const metadata = await this.metadataService.getQuestMetadata(
      questId,
      userId,
    );
    if (!metadata) {
      throw new NotFoundException('Quest or user not found');
    }
    return metadata;
  }

  /**
   * Serve placeholder image for event SBT
   * In production, this should return actual generated image
   */
  @Get('image/event/:eventId')
  async getEventImage(
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Generate SVG placeholder image
    const svg = this.generateEventSvg(event.title);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }

  /**
   * Serve placeholder image for quest SBT
   */
  @Get('image/quest/:questId')
  async getQuestImage(
    @Param('questId') questId: string,
    @Res() res: Response,
  ): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    const svg = this.generateQuestSvg(quest.title);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }

  private generateEventSvg(title: string): string {
    const escapedTitle = this.escapeXml(title);
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="140" r="60" fill="rgba(255,255,255,0.2)"/>
  <text x="200" y="155" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">🎫</text>
  <text x="200" y="240" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="bold">EVENT ATTENDANCE</text>
  <text x="200" y="280" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.9)" text-anchor="middle">${escapedTitle.slice(0, 30)}</text>
  <text x="200" y="340" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle">LFF Soulbound Token</text>
  <rect x="20" y="360" width="360" height="20" rx="10" fill="rgba(255,255,255,0.1)"/>
  <text x="200" y="375" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.5)" text-anchor="middle">Non-Transferable</text>
</svg>`;
  }

  private generateQuestSvg(title: string): string {
    const escapedTitle = this.escapeXml(title);
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="140" r="60" fill="rgba(255,255,255,0.2)"/>
  <text x="200" y="155" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">🏆</text>
  <text x="200" y="240" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="bold">QUEST COMPLETED</text>
  <text x="200" y="280" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.9)" text-anchor="middle">${escapedTitle.slice(0, 30)}</text>
  <text x="200" y="340" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle">LFF Soulbound Token</text>
  <rect x="20" y="360" width="360" height="20" rx="10" fill="rgba(255,255,255,0.1)"/>
  <text x="200" y="375" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.5)" text-anchor="middle">Non-Transferable</text>
</svg>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
