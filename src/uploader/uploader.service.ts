import { Injectable } from '@nestjs/common';
import { AwsS3Service } from './aws.service';

@Injectable()
export class UploaderService {
   constructor(private readonly awsS3Service: AwsS3Service) {}

  async uploadFile(file: Express.Multer.File, folder: string) {
    return this.awsS3Service.uploadFile(file, folder);
  }

  async deleteFile(key: string) {
    return this.awsS3Service.deleteFile(key);
  }
}
