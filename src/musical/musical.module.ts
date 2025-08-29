import { Module } from '@nestjs/common';
import { MusicalService } from './musical.service';
import { MusicalController } from './musical.controller';

@Module({
  controllers: [MusicalController],
  providers: [MusicalService],
})
export class MusicalModule {}
