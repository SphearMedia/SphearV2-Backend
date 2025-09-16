import { Resend } from 'resend';


export interface MailPayload {
  from?: string; // Optional — default can be used
  to: string[]; // Always array
  subject: string;
  html?: string;
  text?: string;
  react?: any;
}
export const DEFAULT_FROM = 'Alex <relation@sphearmusic.xyz>';

