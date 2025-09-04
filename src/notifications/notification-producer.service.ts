// src/notifications/notification-producer.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationProducerService {
  constructor(
    @InjectQueue('notification-queue') private notificationQueue: Queue,
  ) {}

  async queueReleaseNotificationJob(
    userId: string,
    artistName: string,
    title: string,
    type: 'album' | 'single',
  ) {
    await this.notificationQueue.add('send-release-notification', {
      userId,
      artistName,
      title,
      type,
    });
  }

  async queueBulkReleaseNotifications(
    userIds: string[],
    artistName: string,
    title: string,
    type: 'album' | 'single',
  ) {
    const jobs = userIds.map((userId) => ({
      name: 'send-release-notification',
      data: { userId, artistName, title, type },
    }));
    await this.notificationQueue.addBulk(jobs);
  }
}
