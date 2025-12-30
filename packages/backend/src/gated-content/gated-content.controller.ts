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
import { GatedContentService } from './gated-content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateGatedContentDto } from './dto/create-gated-content.dto';
import { UpdateGatedContentDto } from './dto/update-gated-content.dto';
import { Role } from '@prisma/client';

@Controller('gated-content')
export class GatedContentController {
  constructor(private gatedContentService: GatedContentService) {}

  @Get()
  findAll() {
    return this.gatedContentService.findAllContent();
  }

  @Get(':id/preview')
  getPreview(@Param('id') id: string) {
    return this.gatedContentService.getContentPreview(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getContent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gatedContentService.getContent(id, user.id);
  }

  @Get(':id/check-access')
  @UseGuards(JwtAuthGuard)
  checkAccess(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gatedContentService.checkAccess(id, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateGatedContentDto) {
    return this.gatedContentService.createContent(user.creator.id, dto);
  }

  @Get('creator/my-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  getCreatorContent(@CurrentUser() user: any) {
    return this.gatedContentService.getCreatorContent(user.creator.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateGatedContentDto,
  ) {
    return this.gatedContentService.updateContent(id, user.creator.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gatedContentService.deleteContent(id, user.creator.id);
  }
}
