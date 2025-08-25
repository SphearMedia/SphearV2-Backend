import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import {
  CreateAccountSchemaValidator,
  ForgotPasswordSchemaValidator,
  LoginSchemaValidator,
  RequestEmailVerificationSchemaValidator,
  ResendEmailSchemaValidator,
  ResetPasswordSchemaValidator,
  UpdateUserTypeSchemaValidator,
  VerifyEmailSchemaValidator,
} from 'src/pipes/input.validators';
import {
  CreateAccountAuthDto,
  ForgotPasswordAuthDto,
  LoginAuthDto,
  RequestEmailVerificationAuthDto,
  ResendEmailAuthDto,
  ResetPasswordAuthDto,
  UpdateUserTypeAuthDto,
  VerifyEmailAuthDto,
} from './dto/auth_dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-verification')
  async requestEmailVerification(
    @Body(new JoiValidationPipe(RequestEmailVerificationSchemaValidator))
    dto: RequestEmailVerificationAuthDto,
  ) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post('verify-otp')
  async verifyEmailOtp(
    @Body(new JoiValidationPipe(VerifyEmailSchemaValidator))
    dto: VerifyEmailAuthDto,
  ) {
    return this.authService.verifyEmailOtp(dto.email, dto.code);
  }

  @Post('create-account')
  async createAccount(
    @Body(new JoiValidationPipe(CreateAccountSchemaValidator))
    dto: CreateAccountAuthDto,
  ) {
    return this.authService.createAccount(dto.email, dto.password);
  }

  @Post('login')
  async login(
    @Body(new JoiValidationPipe(LoginSchemaValidator))
    dto: LoginAuthDto,
  ) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('resend-otp')
  async resendOtp(
    @Body(new JoiValidationPipe(ResendEmailSchemaValidator))
    dto: ResendEmailAuthDto,
  ) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body(new JoiValidationPipe(ForgotPasswordSchemaValidator))
    dto: ForgotPasswordAuthDto,
  ) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body(new JoiValidationPipe(ResetPasswordSchemaValidator))
    dto: ResetPasswordAuthDto,
  ) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @Patch('update-user-type')
  async updateUserType(
    @Body(new JoiValidationPipe(UpdateUserTypeSchemaValidator))
    dto: UpdateUserTypeAuthDto,
    @Req() req,
  ) {
    return this.authService.updateUserType(req.user.id, dto.isArtist);
  }
}
