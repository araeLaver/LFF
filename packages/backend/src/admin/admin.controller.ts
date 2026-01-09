import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('creators')
  getCreators(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getCreators(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('quests')
  getQuests(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getQuestsForModeration(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('quests/:id')
  deleteQuest(@Param('id') id: string) {
    return this.adminService.deleteQuest(id);
  }

  @Get('events')
  getEvents(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getEventsForModeration(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(id);
  }

  @Get('gated-content')
  getGatedContent(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getGatedContentForModeration(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('gated-content/:id')
  deleteGatedContent(@Param('id') id: string) {
    return this.adminService.deleteGatedContent(id);
  }
}
