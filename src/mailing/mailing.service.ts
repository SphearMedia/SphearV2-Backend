import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_FROM, MailPayload } from './dto/create-mailing.dto';
import { Resend, CreateEmailOptions } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailingService {
  private resend: Resend;
  private readonly logger = new Logger(MailingService.name);

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendSingleEmail(payload: MailPayload) {
    const sendInput = {
      from: DEFAULT_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    } as CreateEmailOptions;
    const { data, error } = await this.resend.emails.send(sendInput);

    if (error) {
      this.logger.error('Error sending email via Resend', error);
      return;
    }

    this.logger.log(`Email sent, id = ${data.id}`);
  }

  async sendBatchMail(payloads: MailPayload[]) {
    const formattedPayloads = payloads.map(
      (payload) =>
        ({
          from: DEFAULT_FROM,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }) as CreateEmailOptions,
    );
    const { data, error } = await this.resend.batch.send(formattedPayloads);

    if (error) {
      this.logger.error('Error sending email via Resend', error);
      return;
    }

    // this.logger.log(`Batch email sent, ids = ${data.map((d) => d.id).join(', ')}`);

  // return data;
  }

  // async sendSingleEmail(payload: SendEmailRequest) {
  //   const formatted = buildSingleEmailPayload(payload);
  //   const { data, error } = await this.resend.emails.send(formatted);
  //   //if (error) throw new Error(`Email error: ${error.message}`);
  //   if (error) {
  //     this.logger.error('Error sending email via Resend', error);
  //     return;
  //   }

  //   this.logger.log(`Email sent, id = ${data.id}`);
  //   return data;
  // }

  // async sendBatchEmails(payloads: EmailPayload[]) {
  //   const formatted = buildBatchEmailPayload(payloads);
  //   const { data, error } = await this.resend.batch.send(formatted);
  //   //if (error) throw new Error(`Batch email error: ${error.message}`);
  //   if (error) {
  //     this.logger.error('Error sending email via Resend', error);
  //     return;
  //   }
  //   return data;
  // }

  // async sendEmail(options: {
  //   to: string | string[];
  //   subject: string;
  //   html?: string;
  //   text?: string;
  //   // possibly react template if you want
  //   react?: any;
  // }): Promise<{ id: string }> {
  //   const { to, subject, html, text, react } = options;

  //   const sendOptions: any = {
  //     from: this.configService.get<string>('RESEND_SENDER'),
  //     to,
  //     subject,
  //   };

  //   if (react) {
  //     sendOptions.react = react;
  //   } else if (html) {
  //     sendOptions.html = html;
  //   } else if (text) {
  //     sendOptions.text = text;
  //   }

  //   const { data, error } = await this.resend.emails.send(sendOptions);

  //   if (error) {
  //     this.logger.error('Error sending email via Resend', error);
  //     throw new Error(`Email send failed: ${error.message || error}`);
  //   }

  //   this.logger.log(`Email sent, id = ${data.id}`);
  //   return { id: data.id };
  // }
}
