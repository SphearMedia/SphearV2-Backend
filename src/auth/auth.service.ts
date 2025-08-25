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
import { SuccessResponse } from 'src/utils/response.util';
import { StatusCodes } from 'http-status-codes';

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
    await this.userService.updateProfile(userId, {
      role: isArtist ? 'artist' : 'user',
    });
    return SuccessResponse(
      StatusCodes.OK,
      `User role updated to ${isArtist ? 'artist' : 'user'}`,
      { id: userId, role: isArtist ? 'artist' : 'user' },
    );
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
