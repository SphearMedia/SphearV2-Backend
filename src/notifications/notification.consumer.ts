// src/notifications/notification.consumer.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Processor('notification-queue')
@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-release-notification')
  async handleReleaseNotification(job: Job) {
    const { userId, artistName, title, type } = job.data;
    this.logger.log(`Sending ${type} notification to ${userId}...`);
    await this.notificationsService.createReleaseNotification(
      userId,
      artistName,
      title,
      type,
    );
  }
}
