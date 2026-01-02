import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService, UploadResult } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image/:category')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('category') category: string,
  ): Promise<UploadResult> {
    const validCategories = ['quests', 'events', 'profiles'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      );
    }

    return this.uploadService.uploadImage(
      file,
      category as 'quests' | 'events' | 'profiles',
    );
  }
}
