import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  optimized?: boolean;
}

interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
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

  private async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizeOptions = {},
  ): Promise<{ buffer: Buffer; format: string }> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 80,
      format = 'webp',
    } = options;

    let sharpInstance = sharp(buffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();

    // Resize if needed (keep aspect ratio)
    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert and compress based on format
    let outputBuffer: Buffer;
    if (format === 'webp') {
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
    } else if (format === 'jpeg') {
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
    } else {
      outputBuffer = await sharpInstance.png({ quality }).toBuffer();
    }

    return { buffer: outputBuffer, format };
  }

  async uploadImage(
    file: Express.Multer.File,
    category: 'quests' | 'events' | 'profiles',
    optimize: boolean = true,
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

    let bufferToWrite = file.buffer;
    let finalMimeType = file.mimetype;
    let finalExt = path.extname(file.originalname).toLowerCase();
    let optimized = false;

    // Optimize image if enabled (skip GIFs to preserve animation)
    if (optimize && file.mimetype !== 'image/gif') {
      try {
        // Different optimization settings per category
        const optimizeOptions: ImageOptimizeOptions =
          category === 'profiles'
            ? { maxWidth: 512, maxHeight: 512, quality: 85, format: 'webp' }
            : { maxWidth: 1920, maxHeight: 1920, quality: 80, format: 'webp' };

        const result = await this.optimizeImage(file.buffer, optimizeOptions);
        bufferToWrite = result.buffer;
        finalMimeType = `image/${result.format}`;
        finalExt = `.${result.format}`;
        optimized = true;

        this.logger.log(
          `Image optimized: ${file.size} bytes -> ${bufferToWrite.length} bytes (${Math.round((1 - bufferToWrite.length / file.size) * 100)}% reduction)`,
        );
      } catch (error) {
        this.logger.warn(`Image optimization failed, using original: ${error.message}`);
        // Fall back to original file if optimization fails
      }
    }

    // Generate unique filename
    const filename = `${uuidv4()}${finalExt}`;
    const relativePath = `images/${category}/${filename}`;
    const fullPath = path.join(this.uploadDir, relativePath);

    // Write file
    try {
      fs.writeFileSync(fullPath, bufferToWrite);
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
      size: bufferToWrite.length,
      mimeType: finalMimeType,
      optimized,
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
