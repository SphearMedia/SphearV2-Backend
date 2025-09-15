import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { NotificationType } from 'src/enums/notification.enum';
import { Notification } from 'src/models/notification.schema';

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

  async createAlbumReleaseNotification(
    userId: string,
    albumTitle: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'New Album Released! 🎉',
      `Your album "${albumTitle}" has been successfully released! Share your masterpiece with the world and let your music inspire others. Congratulations on this incredible achievement!`,
      NotificationType.ALBUM_RELEASE,
    );
  }

  async createSingleReleaseNotification(
    userId: string,
    singleTitle: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'New Single Released! 🎉',
      `Your single "${singleTitle}" has been successfully released! Share your latest hit with the world and let your music resonate with listeners everywhere. Congratulations on this exciting milestone!`,
      NotificationType.SINGLE_REALEASE,
    );
  }

  async createReleaseNotification(
    userId: string,
    artistName: string,
    releaseTitle: string,
    releaseType: 'album' | 'single',
  ): Promise<Notification> {
    const isAlbum = releaseType === 'album';
    const title = isAlbum ? 'New Album Alert! 🎵' : 'New Single Alert! 🎵';

    const message = isAlbum
      ? `${artistName} has just released a new album titled "${releaseTitle}". Dive into the latest sounds and support your favorite artist by giving it a listen!`
      : `${artistName} has just dropped a new single titled "${releaseTitle}". Check it out now and stay tuned for more amazing music!`;

    const type = isAlbum
      ? NotificationType.ALBUM_RELEASE
      : NotificationType.SINGLE_REALEASE;

    return this.createNotification(userId, title, message, type);
  }

  async createSubscriptionPurchaseNotification(
    userId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Subscription Activated! 🎉',
      'Your subscription is now active! Enjoy unlimited access to exclusive content, early releases, and a world of music at your fingertips. Thank you for being a valued member of our community!',
      NotificationType.SUBSCRIPTION_PURCHASE,
    );
  }

  async createSubscriptionCancellationNotification(
    userId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Subscription Cancelled',
      'Your subscription has been cancelled. We\'re sorry to see you go! If you change your mind, we\'d love to welcome you back to enjoy all the exclusive content and features. Thank you for being part of our community.',
      NotificationType.SUBSCRIPTION_CANCELLATION,
    );
  }

  async createSubscriptionRenewalNotification(
    userId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Subscription Renewed! 🎉',
      'Your subscription has been successfully renewed! Enjoy uninterrupted access to exclusive content, early releases, and a world of music at your fingertips. Thank you for continuing to be a valued member of our community!',
      NotificationType.SUBSCRIPTION_RENEWAL,
    );
  }

  async createPaymentFailureNotification(userId: string): Promise<Notification> {
    return this.createNotification(
      userId,
      'Payment Failure Alert',
      'We encountered an issue processing your recent payment. Please update your payment information to continue enjoying uninterrupted access to our services. If you need assistance, our support team is here to help!',
      NotificationType.PAYMENT_FAILURE,
    );
  }

  async createSystemMaintenanceNotification(
    userId: string,
    maintenanceTime: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      'Scheduled System Maintenance',
      `We will be performing scheduled maintenance on our system on ${maintenanceTime}. During this time, some services may be temporarily unavailable. We apologize for any inconvenience and appreciate your understanding as we work to improve your experience.`,
      NotificationType.SYSTEM_MAINTENANCE,
    );
  }
}
