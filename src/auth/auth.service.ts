import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { createToken } from 'src/utils/token.setup.utils';
import { ErrorResponse, SuccessResponse } from 'src/utils/response.util';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { UploaderService } from 'src/uploader/uploader.service';
import { ArtistProfilesetterDto } from './dto/auth_dtos';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

import { randomInt } from 'crypto';

interface OtpStoreEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  // private otpStore: Map<string, OtpStoreEntry> = new Map();
  private customRedisClient: Redis;
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private uploaderService: UploaderService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.customRedisClient = this.redisService.getOrThrow('default');
  }

  private async generateOtp(key: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    await this.customRedisClient.set(`otp:${key}`, otp, 'EX', 3600); //1 hr but 600 for 10 min TTL
    return otp;
  }

  private async generateResetOtp(key: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    await this.customRedisClient.set(`resetotp:${key}`, otp, 'EX', 3600); //1 hr but 600 for 10 min TTL
    return otp;
  }

  private async verifyOtp(key: string, otp: string): Promise<boolean> {
    const stored = await this.customRedisClient.get(`otp:${key}`);
    if (stored && stored === otp) {
      // await this.customRedisClient.del(`otp:${key}`); // one-time use
      return true;
    }
    return false;
  }

  private async verifyResetOtp(key: string, otp: string): Promise<boolean> {
    const stored = await this.customRedisClient.get(`resetotp:${key}`);
    if (stored && stored === otp) {
      await this.customRedisClient.del(`resetotp:${key}`); // one-time use
      return true;
    }
    return false;
  }

  private async didDataExists(key: string): Promise<boolean> {
    const exists = await this.customRedisClient.exists(`otp:${key}`);
    return exists === 1;
  }

  private async deleteOtp(key: string) {
    await this.customRedisClient.del(`otp:${key}`);
  }

  async requestEmailVerification(email: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing?.emailVerified)
      throw new BadRequestException('Email already registered');

    const otp = await this.generateOtp(email);
    // const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    // this.otpStore.set(email, { code: otp, expiresAt });

    // Replace this with actual email service
    console.log(`[OTP] Sending code ${otp} to ${email}`);

    return SuccessResponse(StatusCodes.OK, 'Verification code sent to email', {
      email: email,
    });
  }

  async verifyEmailOtp(email: string, code: string) {
    const isValid = await this.verifyOtp(email, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    // const entry = this.otpStore.get(email);
    // if (!entry) throw new NotFoundException('No verification code sent');
    // if (entry.expiresAt < new Date())
    //   throw new BadRequestException('Code expired');
    // if (entry.code !== code) throw new UnauthorizedException('Invalid code');

    const user = await this.userService.findByEmail(email);
    if (user && !user.emailVerified) {
      await this.userService.updateProfile(user.id, { emailVerified: true });
    } else {
      console.log('User not found or already verified');
    }
    return SuccessResponse(StatusCodes.OK, 'Email verified successfully', {
      email: email,
    });
  }

  async createAccount(email: string, password: string) {
    // const entry = this.otpStore.get(email);
    const entryExists = await this.didDataExists(email);
    if (!entryExists) throw new UnauthorizedException('Email not verified');

    const username =
      email.split('@')[0].toLowerCase().replace(/\s+/g, '') + Date.now();
    const fullName =
      email.split('@')[0].toLowerCase().replace(/\s+/g, '') + Date.now();
    //verify email too
    const user = await this.userService.createUser({
      email,
      username,
      fullName,
      password,
      emailVerified: true,
    });

    await this.deleteOtp(email);
    //this.otpStore.delete(email);
    const access_token = createToken(user, this.configService, this.jwtService);
    return SuccessResponse(
      StatusCodes.CREATED,
      'Account created successfully',
      { id: user._id, access_token },
    );
  }

  async login(email: string, password: string) {
    const user = await this.userService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const access_token = createToken(user, this.configService, this.jwtService);
    if (!user.emailVerified) {
      return ErrorResponse(
        StatusCodes.UNAUTHORIZED,
        'Email not verified',
        //  'needsEmailVerification',{}
        {
          id: user._id,
          needsEmailVerification: true,
          access_token,
        },
      );
    }

    if (user.role === 'user' && !user.referredBy) {
      return ErrorResponse(
        StatusCodes.UNAUTHORIZED,
        'Invite code not verified',
        {
          id: user._id,
          needsInviteCodeVerification: true,
          access_token,
        },
      );
    }
    return SuccessResponse(StatusCodes.OK, 'Login successful', {
      id: user._id,
      role: user.role,
      access_token,
    });
  }

  async resendOtp(email: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');

    const otp = await this.generateOtp(email);

    console.log(`[OTP] Sending code ${otp} to ${email}`);
    return SuccessResponse(
      StatusCodes.OK,
      'Verification code resent to email',
      { email: email },
    );
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.generateResetOtp(email);
    // const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // this.otpStore.set(email, { code: otp, expiresAt });

    // Replace with actual email logic
    console.log(`[RESET OTP] ${otp} sent to ${email}`);

    return SuccessResponse(
      StatusCodes.OK,
      'Password reset code sent to email',
      { email: email },
    );
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await this.verifyResetOtp(email, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    // const entry = this.otpStore.get(email);
    // if (!entry || entry.code !== code || entry.expiresAt < new Date()) {
    //   throw new UnauthorizedException('Invalid or expired code');
    // }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return SuccessResponse(StatusCodes.OK, 'Password reset successfully', {
      email: email,
    });
  }

  async updateUserType(userId: string, isArtist: boolean) {
    let user = await this.userService.findById(userId);
    console.log(userId);
    if (!user) throw new NotFoundException('User not found');

    const role = isArtist ? 'artist' : 'user';
    const inviteCode = isArtist ? uuidv4().slice(0, 6) : undefined;

   user = await this.userService.updateProfile(userId, {
      role,
      referralCode: inviteCode,
    });

    const access_token = createToken(user, this.configService, this.jwtService);

    return SuccessResponse(
      StatusCodes.OK,
      `User role updated to ${isArtist ? 'artist' : 'user'}`,
      { id: userId, role, inviteCode, access_token },
    );
  }

  async verifyArtistInviteCode(userId: string, inviteCode: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.referredBy)
      throw new BadRequestException('Invite code already used');

    const artist = await this.userService.findByReferralCode(inviteCode);
    if (!artist) throw new NotFoundException('Invalid invite code');
    if (artist.role !== 'artist')
      throw new BadRequestException('Invite code must belong to an artist');

    // Update referredBy on user
    await this.userService.updateProfile(userId, {
      referredBy: artist.id,
    });

    // Update referredUsers on artist
    await this.userService.updateProfile(artist.id, {
      referredUsers: [
        ...(artist.referredUsers || []),
        new Types.ObjectId(userId),
      ],
    });

    return SuccessResponse(
      StatusCodes.OK,
      'Invite code verified successfully',
      {
        userId,
        referredBy: artist._id,
        artistUsername: artist.username,
        message: 'Invite code applied successfully',
      },
    );
  }

  async uploadTest(file: Express.Multer.File) {
    const { url, key } = await this.uploaderService.uploadFile(
      file,
      'test-folder',
    );
    return SuccessResponse(StatusCodes.OK, 'File uploaded successfully', {
      key,
      url,
    });
  }

  async setupArtistProfile(
    userId: string,
    file: Express.Multer.File,
    dto: ArtistProfilesetterDto,
  ) {
    const { url, key } = await this.uploaderService.uploadFile(
      file,
      'cover-photos',
    );
    console.log('Uploaded file URL:', url);
    await this.userService.updateProfile(userId, {
      fullName: dto.fullName,
      stageName: dto.stageName,
      artistCoverImage: url,
    });
    return SuccessResponse(StatusCodes.OK, 'File uploaded successfully', {
      key,
      url,
    });
  }
}
