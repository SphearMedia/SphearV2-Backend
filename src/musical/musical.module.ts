import { Module } from '@nestjs/common';
import { MusicalService } from './musical.service';
import { MusicalController } from './musical.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from 'src/models/project.schema';
import { Track, TrackSchema } from 'src/models/track.schema';
import { UploaderModule } from 'src/uploader/uploader.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Track.name, schema: TrackSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    UsersModule,
    UploaderModule,
  ],
  controllers: [MusicalController],
  providers: [MusicalService],
})
export class MusicalModule {}
