import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [HttpModule, UsersModule, NotificationsModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
