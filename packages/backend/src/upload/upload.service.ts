import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';

    // Ensure upload directory exists
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists(): void {
    const dirs = ['', 'images', 'images/quests', 'images/events', 'images/profiles'];

    for (const dir of dirs) {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Created directory: ${fullPath}`);
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    category: 'quests' | 'events' | 'profiles',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const relativePath = `images/${category}/${filename}`;
    const fullPath = path.join(this.uploadDir, relativePath);

    // Write file
    try {
      fs.writeFileSync(fullPath, file.buffer);
      this.logger.log(`File uploaded: ${relativePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${error.message}`);
      throw new BadRequestException('Failed to save file');
    }

    return {
      filename,
      originalName: file.originalname,
      path: relativePath,
      url: `${this.baseUrl}/uploads/${relativePath}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract path from URL
      const urlPath = imageUrl.replace(`${this.baseUrl}/uploads/`, '');
      const fullPath = path.join(this.uploadDir, urlPath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`File deleted: ${urlPath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}
