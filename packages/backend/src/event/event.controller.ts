import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RedeemQrDto } from './dto/redeem-qr.dto';
import { Role } from '@prisma/client';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Get()
  findAll() {
    return this.eventService.findAllEvents();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findEventById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.creator.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(id, user.creator.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.eventService.deleteEvent(id, user.creator.id);
  }

  @Get('creator/my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  getCreatorEvents(@CurrentUser() user: any) {
    return this.eventService.getCreatorEvents(user.creator.id);
  }

  @Post(':id/qrcode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  generateQRCode(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.eventService.generateQRCode(eventId, user.creator.id);
  }

  @Patch('qrcode/:qrCodeId/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  deactivateQRCode(
    @CurrentUser() user: any,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.eventService.deactivateQRCode(qrCodeId, user.creator.id);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  redeemQRCode(@CurrentUser() user: any, @Body() dto: RedeemQrDto) {
    return this.eventService.redeemQRCode(user.id, dto.code);
  }
}
