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

interface OtpStoreEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private otpStore: Map<string, OtpStoreEntry> = new Map();
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestEmailVerification(email: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    this.otpStore.set(email, { code: otp, expiresAt });

    // Replace this with actual email service
    console.log(`[OTP] Sending code ${otp} to ${email}`);

    return SuccessResponse(StatusCodes.OK, 'Verification code sent to email', {
      email: email,
    });
  }

  async verifyEmailOtp(email: string, code: string) {
    const entry = this.otpStore.get(email);
    if (!entry) throw new NotFoundException('No verification code sent');
    if (entry.expiresAt < new Date())
      throw new BadRequestException('Code expired');
    if (entry.code !== code) throw new UnauthorizedException('Invalid code');

    const user = await this.userService.findByEmail(email);
    if (user && !user.emailVerified) {
      await this.userService.updateProfile(user.id, { emailVerified: true });
    }
    return SuccessResponse(StatusCodes.OK, 'Email verified successfully', {
      email: email,
    });
  }

  async createAccount(email: string, password: string) {
    const entry = this.otpStore.get(email);
    if (!entry) throw new UnauthorizedException('Email not verified');

    const username =
      email.split('@')[0].toLowerCase().replace(/\s+/g, '') + Date.now();
    const fullName =
      email.split('@')[0].toLowerCase().replace(/\s+/g, '') + Date.now();

    const user = await this.userService.createUser({
      email,
      username,
      fullName,
      password,
    });

    this.otpStore.delete(email);
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
      throw ErrorResponse(
        StatusCodes.UNAUTHORIZED,
        'Email not verified',
        //  'needsEmailVerification',{}
        {
          id: user._id,
          needsEmailVerification: true,
          access_token
        },
      );
    }

    if (user.role === 'user' && !user.referredBy) {
      throw ErrorResponse(
        StatusCodes.UNAUTHORIZED,
        'Invite code not verified',
        {
          id: user._id,
          needsInviteCodeVerification: true,
          access_token
        },
      );
    }
    return SuccessResponse(StatusCodes.OK, 'Login successful', {
      id: user._id,
      access_token,
    });
  }

  async resendOtp(email: string) {
    await this.requestEmailVerification(email);
    return SuccessResponse(
      StatusCodes.OK,
      'Verification code resent to email',
      { email: email },
    );
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    this.otpStore.set(email, { code: otp, expiresAt });

    // Replace with actual email logic
    console.log(`[RESET OTP] ${otp} sent to ${email}`);

    return SuccessResponse(
      StatusCodes.OK,
      'Password reset code sent to email',
      { email: email },
    );
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const entry = this.otpStore.get(email);
    if (!entry || entry.code !== code || entry.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    this.otpStore.delete(email);
    return SuccessResponse(StatusCodes.OK, 'Password reset successfully', {
      email: email,
    });
  }

  async updateUserType(userId: string, isArtist: boolean) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const role = isArtist ? 'artist' : 'user';
    const inviteCode = isArtist ? uuidv4().slice(0, 8) : undefined;

    await this.userService.updateProfile(userId, {
      role,
      referralCode: inviteCode,
    });

    return SuccessResponse(
      StatusCodes.OK,
      `User role updated to ${isArtist ? 'artist' : 'user'}`,
      { id: userId, role, inviteCode },
    );
  }

  async verifyArtistInviteCode(code: string, userId: string) {
    const artist = await this.userService.findByReferralCode(code);
    if (!artist || artist.role !== 'artist') {
      throw new NotFoundException('Invalid or expired invite code');
    }

    await this.userService.updateProfile(userId, {
      referredBy: artist.id,
    });

    const userObjectId = new Types.ObjectId(userId);

    await this.userService.updateProfile(artist.id, {
      referredUsers: [...(artist.referredUsers || []), userObjectId],
    });

    return SuccessResponse(
      StatusCodes.OK,
      'Invite code verified successfully',
      {
        referredBy: artist.id,
        artistId: artist._id,
        artistUsername: artist.username,
        message: 'Invite code applied successfully',
      },
    );
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
