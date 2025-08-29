import { Module } from '@nestjs/common';
import { UploaderService } from './uploader.service';
import { AwsS3Service } from './aws.service';

@Module({
  providers: [UploaderService, AwsS3Service],
  exports: [UploaderService],
})
export class UploaderModule {}
