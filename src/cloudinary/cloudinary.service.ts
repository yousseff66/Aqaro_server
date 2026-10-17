import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    return new Promise<any>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'sakan/properties',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    return this.cloudinary.uploader.destroy(publicId);
  }
}
