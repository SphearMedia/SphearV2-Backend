// src/notifications/notification-queue.module.ts
import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { NotificationProducerService } from './notification-producer.service';
import { NotificationsService } from './notifications.service'; // your existing service
import { UsersModule } from 'src/users/users.module';
import { NotificationConsumer } from './notification.consumer';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
    forwardRef(() => NotificationsModule),
    
  ],
  providers: [NotificationConsumer, NotificationProducerService],
  exports: [NotificationProducerService],
})
export class NotificationQueueModule {}
