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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Get('create-subscription')
  async createSubscription(@Req() req) {
    return this.paymentService.createSubscription(req.user.userId);
  }

  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.body as Buffer;
    return this.paymentService.handleWebhookEvent(signature, payload);
  }
}
