import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
  /** 🎯 Core Identity */
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true })
  password: string; // hashed

  /** 🎨 Profile */
  @Prop({ default: 'https://res.cloudinary.com/default-profile.png' })
  profilePicture: string;

  @Prop({ default: '', trim: true })
  bio: string;

  @Prop({ type: [String], default: [] })
  favoriteGenres: string[];

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
  @Prop({ default: null })
  stageName?: string;

  @Prop({ type: [String], default: [] })
  genres?: string[]; // artist genres

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
}

export const UserSchema = SchemaFactory.createForClass(User);
