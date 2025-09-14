import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GenreEnum } from 'src/enums/track.data.enums';
import { GenderEnum } from 'src/enums/user.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
  /** 🎯 Core Identity */
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true, sparse: true })
  fullName: string;

  @Prop({ required: true })
  password: string; // hashed

  /** 🎨 Profile */
  @Prop({ default: null, sparse: true })
  profilePicture?: string;

  @Prop({ default: '', trim: true })
  bio: string;

  @Prop({
    type: {
      day: { type: Number },
      month: { type: Number },
      year: { type: Number },
    },
    default: null,
  })
  dateOfBirth?: {
    day: number;
    month: number;
    year: number;
  };

  @Prop({ enum: GenderEnum, default: GenderEnum.PREFER_NOT_TO_SAY })
  gender: GenderEnum;

  @Prop({ trim: true })
  timezone?: string; // e.g., Africa/Lagos

  @Prop({ trim: true })
  country?: string; // e.g., Nigeria, India

  /** 🔐 Wallet */
  @Prop({ default: null, sparse: true })
  encryptedWalletKey: string;

  /** 🎭 Role & Flags */
  @Prop({ default: 'user', enum: ['user', 'artist', 'admin'] })
  role: 'user' | 'artist' | 'admin';

  @Prop({ default: false })
  emailVerified: boolean;

  /** 🧠 Artist Info (if applicable) */
  @Prop({ default: null, trim: true, sparse: true })
  stageName?: string;

  @Prop({ default: null, trim: true, sparse: true })
  artistCoverImage?: string;

  @Prop({ type: [String], default: [] })
  genres?: string[]; // artist genres

  @Prop({ type: [String], default: [] })
  favoriteGenres: GenreEnum[];

  @Prop({ default: false })
  isVerifiedArtist: boolean;

  /** 🌐 Social / Community */
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  following: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  followers: Types.ObjectId[];

  @Prop({
    type: {
      website: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    default: {},
    _id: false,
  })
  links: {
    website?: string;
    twitter?: string;
    instagram?: string;
  };

  /** 🔄 Device & Session */
  @Prop({ default: null })
  deviceToken?: string;

  @Prop()
  refreshToken?: string;

  @Prop({ default: null, sparse: true })
  referralCode: string;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  referredBy?: Types.ObjectId;

  @Prop({ default: [], type: [Types.ObjectId], ref: 'User' })
  referredUsers?: Types.ObjectId[];

  /** 💳 Subscription & Payment */
  @Prop({ type: String, default: null })
  stripeCustomerId?: string;

  @Prop({ type: String, default: null })
  stripeSubscriptionId?: string;

  @Prop({ type: Boolean, default: false })
  isSubscribed?: boolean;

  @Prop({ type: Date, default: null })
  subscriptionStartDate?: Date;

  @Prop({ type: Date, default: null })
  subscriptionEndDate?: Date;

  @Prop({
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'],
    default: null,
  })
  subscriptionStatus?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
