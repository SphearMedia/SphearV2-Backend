import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GenreEnum } from 'src/enums/track.data.enums';

export type TrackDocument = Track & Document;

@Schema({ timestamps: true })
export class Track extends Document {
  @Prop({ required: true })
  title: string;

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

  @Prop() recordLabel?: string;

  @Prop() composer?: string;

  @Prop() songWriter?: string;

  @Prop() producer?: string;

  @Prop({ required: true })
  audioFileUrl: string;

  @Prop() lyrics?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: 0 })
  playCount: number;
}

export const TrackSchema = SchemaFactory.createForClass(Track);
