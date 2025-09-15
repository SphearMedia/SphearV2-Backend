import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusCodes } from 'http-status-codes';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UsersService } from 'src/users/users.service';
import { SuccessResponse } from 'src/utils/response.util';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
    private notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
    );
  }

  async createCustomer(
    email: string,
    userId: string,
  ): Promise<Stripe.Customer> {
    const existing = await this.stripe.customers.list({ email, limit: 1 });
    if (existing.data.length) return existing.data[0];

    return this.stripe.customers.create({
      email,
      metadata: { userId: userId },
    });
  }

  async createSubscription(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const customer = await this.createCustomer(user.email, user.id);

    // Save stripeCustomerId to user if not already saved
    if (!user.stripeCustomerId || user.stripeCustomerId !== customer.id) {
      await this.userService.updateProfile(user.id, {
        stripeCustomerId: customer.id,
      });
    }

    // 🔍 STEP 1: Check if any incomplete subscription already exists
    const existingSubscriptions = await this.stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });

    const incompleteSub = existingSubscriptions.data.find(
      (sub) => sub.status === 'incomplete' && !!sub.latest_invoice,
    );

    if (incompleteSub) {
      const intent = (incompleteSub.latest_invoice as any)
        .payment_intent as Stripe.PaymentIntent;

      if (intent && intent.status !== 'succeeded') {
        return SuccessResponse(StatusCodes.OK, 'Subscription resumed', {
          clientSecret: intent.client_secret,
          subscriptionId: incompleteSub.id,
          customerId: customer.id,
        });
      }
    }

    // 🔁 STEP 2: If no valid incomplete sub, check if already subscribed
    const alreadySubscribed = existingSubscriptions.data.find((sub) =>
      ['active', 'trialing'].includes(sub.status),
    );

    if (alreadySubscribed) {
      throw new BadRequestException('User already has an active subscription');
    }

    // 🆕 STEP 3: Create new subscription
    const priceId = this.configService.get<string>(
      'STRIPE_SUBSCRIPTION_PRICE_ID',
    );

    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.confirmation_secret'], // only expand the invoice here
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;

    if (!latestInvoice?.id) {
      throw new InternalServerErrorException(
        'Invoice ID missing from subscription',
      );
    }

    if (
      !latestInvoice.confirmation_secret ||
      !latestInvoice.confirmation_secret.client_secret
    ) {
      throw new InternalServerErrorException('Missing client secret');
    }

    const clientSecret = latestInvoice.confirmation_secret.client_secret;
    console.log(clientSecret);

    return SuccessResponse(StatusCodes.OK, 'Subscription created', {
      clientSecret: clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  }

  async handleWebhookEvent(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const data = event.data.object as any;

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log('Subscription created/updated event received');
        console.dir(data, { depth: null });
        const subscription = data as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Processing subscription for customer:', customerId);

        const user = await this.userService.findByStripeCustomerId(customerId);
        if (!user) break;

        const isActive = ['active', 'trialing'].includes(subscription.status);
        const startDate = new Date(subscription.start_date * 1000);
        // const endDate = subscription.current_period_end
        //   ? new Date(subscription.current_period_end * 1000)
        //   : undefined;
        const endDate = new Date(
          (subscription as any).current_period_end * 1000,
        );

        // const currentPeriodEnd = (subscription as any).current_period_end;

        // const endDate =
        //   currentPeriodEnd && typeof currentPeriodEnd === 'number'
        //     ? new Date(currentPeriodEnd * 1000)
        //     : undefined;

        await this.notificationsService.createSubscriptionPurchaseNotification(
          user.id,
        );

        await this.userService.updateUserSubscription(user.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          isSubscribed: isActive,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
        });

        break;
      }

      case 'customer.subscription.deleted': {
        console.log('Subscription canceled event received');
        console.dir(data, { depth: null });
        const subscription = data as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Processing subscription for customer:', customerId);
        const user = await this.userService.findByStripeCustomerId(customerId);
        if (!user) break;

        await this.notificationsService.createSubscriptionCancellationNotification(
          user.id,
        );

        await this.userService.updateUserSubscription(user.id, {
          subscriptionStatus: 'canceled',
          isSubscribed: false,
          subscriptionEndDate: new Date(), // now
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('Invoice payment succeeded event received');
        console.dir(data, { depth: null });
        const invoice = data as Stripe.Invoice;
        //const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        console.log('Processing subscription for customer:', customerId);
        const user = await this.userService.findByStripeCustomerId(customerId);
        if (!user) break;

        await this.notificationsService.createSubscriptionRenewalNotification(
          user.id,
        );

        // Optionally update billing details
        await this.userService.updateUserSubscription(user.id, {
          isSubscribed: true,
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(
            invoice.lines.data[0].period.end * 1000,
          ),
        });
        break;
      }

      case 'payment_intent.succeeded': {
        console.log('Payment intent succeeded event received');
        console.dir(data, { depth: null });
        const paymentIntent = data as Stripe.PaymentIntent;
        const customerId = paymentIntent.customer as string;
        console.log('Processing subscription for customer:', customerId);
        const user = await this.userService.findByStripeCustomerId(customerId);
        if (!user) break;

        // Optional: Mark payment verified or log it
        console.log(
          `Payment succeeded for ${user.email} — Amount: ${paymentIntent.amount}`,
        );

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }
    // return { received: true };
  }
}
