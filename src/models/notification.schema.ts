import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from 'src/enums/notification.enum';



@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM 
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object, default: null })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
