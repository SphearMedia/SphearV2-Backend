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

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isRead: false },
        { isRead: true },
      )
      .exec();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  async createLoginNotification(userId: string): Promise<Notification> {
    return this.createNotification(
      userId,
      'Login Successful',
      "You've successfully logged in. Your stage is set — dive back into your world of rhythm, inspiration, and endless vibes. Let the beat guide your journey.",
      NotificationType.LOGIN,
    );
  }

  async createFailedLoginAttemptNotification(
    userId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Security Alert: Failed Login Attempt',
      "We noticed a failed login attempt on your account. If this wasn't you, please consider updating your password to keep your music and data safe. Your security is our priority.",
      NotificationType.SYSTEM,
    );
  }

  async createRegistrationNotification(userId: string): Promise<Notification> {
    return this.createNotification(
      userId,
      'You’re In! Let’s Make Magic ✨',
      'Welcome to Sphear Music — where every sound has a story. Your account is live and ready! Upload your creations, discover new beats, and grow your fanbase. This is where your musical legacy begins.',
      NotificationType.REGISTRATION,
    );
  }

  async createArtistProfileSetupNotification(
    userId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Your Artist Profile is Live! 🎤',
      'Your artist profile is now live! Share your unique sound with the world, connect with fans, and let your music journey begin. This is your stage — own it!',
      NotificationType.PROFILE_UPDATE,
    );
  }
}
