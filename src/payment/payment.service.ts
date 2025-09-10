import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
    );
  }

  async createCustomer(email: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({ email, metadata: { userId: "user._id" }, });
  }

  async createCheckoutSession(
    customerId: string,
  ): Promise<Stripe.Checkout.Session> {
    const priceId = this.configService.get<string>(
      'STRIPE_SUBSCRIPTION_PRICE_ID',
    );

    if (!priceId) throw new BadRequestException('Missing Stripe price ID');

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'https://sphearmusic.xyz/payment-success',
      cancel_url: 'https://sphearmusic.xyz/payment-cancelled',
    });
  }

  async handleWebhookEvent(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', session);
        // Update DB to mark subscription as active
        break;
      }
      case 'invoice.payment_failed': {
        console.log('Payment failed');
        break;
      }
      case 'customer.subscription.deleted': {
        console.log('Subscription canceled');
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}
