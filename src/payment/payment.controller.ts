import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  Headers,
  RawBody,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-checkout-session')
  async createSession(@Body('email') email: string) {
    const customer = await this.paymentService.createCustomer(email);
    const session = await this.paymentService.createCheckoutSession(
      customer.id,
    );
    return { url: session.url };
  }

  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.body;
    // await this.paymentService.handleWebhookEvent(signature, payload);

    return { message: 'stripe webhook data', signature, payload };
  }
}
