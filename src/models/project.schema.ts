import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GenreEnum, ProjectTypeEnum } from 'src/enums/track.data.enums';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ enum: ProjectTypeEnum, required: true })
  type: ProjectTypeEnum;

  @Prop({ required: true })
  primaryArtist: string;

  @Prop({ default: [] })
  featuredArtists: string[];

  @Prop({ default: false })
  isJointRelease: boolean;

  @Prop({ enum: GenreEnum, required: true })
  genre: GenreEnum;

  @Prop({ required: true })
  coverArtUrl: string;

  @Prop() copyright?: string;
  
  @Prop() phonographic?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Track' }], default: [] })
  tracks: Types.ObjectId[];
  
  @Prop({ type: Date, required: true })
  releaseDate: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
