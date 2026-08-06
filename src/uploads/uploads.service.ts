import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  uploadImage(file: Express.Multer.File, folder: string) {
    return {
      success: true,
      message: 'Image uploaded successfully.',
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${folder}/${file.filename}`,
    };
  }
}