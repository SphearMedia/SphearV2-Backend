import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { NotificationsService } from "src/notifications/notifications.service";

// notifications.queue.ts
@Processor('notifications')
export class NotificationsProcessor {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('release')
  async handleRelease(job: Job) {
    const { userId, artistName, releaseTitle, releaseType } = job.data;
    await this.notificationsService.createReleaseNotification(
      userId,
      artistName,
      releaseTitle,
      releaseType,
    );
  }
}
