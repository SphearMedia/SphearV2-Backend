import {
  Body,
  Controller,
  Post,
  Headers,
  RawBody,
  Req,
  Res,
  Get,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/config/roles.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('create-subscription')
  async createSubscription(@Req() req) {
    return this.paymentService.createSubscription(req.user.userId);
  }

  @HttpCode(200)
  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.body as Buffer;
    res.status(200).send();
    try {
      this.paymentService.handleWebhookEvent(signature, payload);
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }
}
