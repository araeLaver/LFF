import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  @Get('nfts/gallery')
  @UseGuards(JwtAuthGuard)
  getNftGallery(@CurrentUser() user: any) {
    return this.userService.getNftGallery(user.id);
  }
}
