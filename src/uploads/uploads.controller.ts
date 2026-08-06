import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';

const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
    return cb(
      new BadRequestException('Only JPG, JPEG, PNG and WEBP images are allowed.'),
      false,
    );
  }

  cb(null, true);
};

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly usersService: UsersService,
  ) {}

  private storage(folder: string) {
    return diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads', folder);

        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },

      filename: (req, file, cb) => {
        const filename =
          `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;

        cb(null, filename);
      },
    });
  }

  

  @Post('profile-image')
  @ApiOperation({ summary: 'Upload Profile Image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Profile image uploaded.' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'profiles');

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProfile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const result = this.uploadsService.uploadImage(file, 'profiles');

    try {
      const user: any = (req as any).user;
      if (user) {
        // store relative url path (frontend will prefix backend origin)
        user.profileImage = `/uploads/profiles/${file.filename}`;
        await this.usersService.save(user);
      }
    } catch (err) {
      // ignore failures to not break upload
    }

    return result;
  }

  @Post('payment-image')
  @ApiOperation({ summary: 'Upload Payment Screenshot' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Payment screenshot uploaded.' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'payments');

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadPayment(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadImage(file, 'payments');
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload Document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded.' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'documents');

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          );
        },
      }),
      // documents may be PDFs or other types; do not restrict to images here
      // keep small size limit for documents as well
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const result = this.uploadsService.uploadImage(file, 'documents');

    // Optionally attach document metadata to user or other DB records here.
    return result;
  }
}