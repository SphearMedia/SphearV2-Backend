import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';
import { StatusCodes } from 'http-status-codes';
import { SuccessResponse } from 'src/utils/response.util';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    // Ensure reasonable limits
    const validatedLimit = Math.min(Math.max(limitNumber, 1), 100);
    const validatedPage = Math.max(pageNumber, 1);

    const result = await this.notificationsService.getUserNotifications(
      req.user.userId,
      validatedPage,
      validatedLimit,
    );

    return SuccessResponse(
      StatusCodes.OK,
      'Notifications retrieved successfully',
      result,
    );
  }

  @Get('unread')
  async getUnreadNotifications(@Req() req) {
    const notifications =
      await this.notificationsService.getUnreadNotifications(req.user.userId);
    return SuccessResponse(
      StatusCodes.OK,
      'Unread notifications retrieved successfully',
      notifications,
    );
  }

  @Patch(':id/mark-read')
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return SuccessResponse(
      StatusCodes.OK,
      'Notification marked as read',
      notification,
    );
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return SuccessResponse(StatusCodes.OK, 'All notifications marked as read');
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return SuccessResponse(StatusCodes.OK, 'Notification deleted successfully');
  }
}
