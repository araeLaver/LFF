import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('creators')
export class CreatorController {
  constructor(private creatorService: CreatorService) {}

  @Get()
  getAllCreators() {
    return this.creatorService.getAllCreators();
  }

  @Get(':id')
  getCreatorProfile(@Param('id') id: string) {
    return this.creatorService.getCreatorProfile(id);
  }

  @Post('become')
  @UseGuards(JwtAuthGuard)
  becomeCreator(@CurrentUser() user: any) {
    return this.creatorService.becomeCreator(user.id);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getMyCreatorProfile(@CurrentUser() user: any) {
    return this.creatorService.getCreatorByUserId(user.id);
  }
}
