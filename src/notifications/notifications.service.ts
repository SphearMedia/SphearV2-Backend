import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { NotificationType } from 'src/enums/notification.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private userService: UsersService,
  ) {}

  async createNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    metadata: Record<string, any> = {},
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      title,
      message,
      type,
      metadata,
      isRead: false,
    });

    return notification.save();
  }
}
