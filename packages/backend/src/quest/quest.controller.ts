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
import { QuestService } from './quest.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { SubmitQuestDto } from './dto/submit-quest.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { Role } from '@prisma/client';

@Controller('quests')
export class QuestController {
  constructor(private questService: QuestService) {}

  @Get()
  findAll() {
    return this.questService.findAllQuests();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questService.findQuestById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateQuestDto) {
    return this.questService.createQuest(user.creator.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateQuestDto,
  ) {
    return this.questService.updateQuest(id, user.creator.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.questService.deleteQuest(id, user.creator.id);
  }

  @Get('creator/my-quests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  getCreatorQuests(@CurrentUser() user: any) {
    return this.questService.findCreatorQuests(user.creator.id);
  }

  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  getQuestSubmissions(@CurrentUser() user: any, @Param('id') questId: string) {
    return this.questService.getSubmissionsByQuest(questId, user.creator.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  submitQuest(
    @CurrentUser() user: any,
    @Param('id') questId: string,
    @Body() dto: SubmitQuestDto,
  ) {
    return this.questService.submitQuest(user.id, questId, dto);
  }

  @Patch('submissions/:submissionId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  reviewSubmission(
    @CurrentUser() user: any,
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.questService.reviewSubmission(
      user.creator.id,
      submissionId,
      dto.status,
    );
  }

  @Get('user/my-submissions')
  @UseGuards(JwtAuthGuard)
  getUserSubmissions(@CurrentUser() user: any) {
    return this.questService.getUserSubmissions(user.id);
  }
}
