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

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const [notifications, totalItems] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId), isRead: false })
      .sort({ createdAt: -1 })
      .exec();
  }
}
