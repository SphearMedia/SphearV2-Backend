import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayHistoryDocument = PlayHistory & Document;

@Schema({ timestamps: true })
export class PlayHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Track', required: true })
  track: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId;

  @Prop({ default: 1 })
  playCount: number;

  @Prop({ default: Date.now })
  lastPlayedAt: Date;
}

export const PlayHistorySchema = SchemaFactory.createForClass(PlayHistory);
