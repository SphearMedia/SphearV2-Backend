import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import {
  CreateAccountSchemaValidator,
  ForgotPasswordSchemaValidator,
  InitialUserProfileUpdateSchemaValidator,
  LoginSchemaValidator,
  RequestEmailVerificationSchemaValidator,
  ResendEmailSchemaValidator,
  ResetPasswordSchemaValidator,
  UpdateArtistProfileSchemaValidator,
  UpdateUserFavouriteGenresValidator,
  UpdateUserTypeSchemaValidator,
  VerifyArtistInviteCodeSchemaValidator,
  VerifyEmailSchemaValidator,
} from 'src/pipes/input.validators';
import {
  ArtistProfilesetterDto,
  CreateAccountAuthDto,
  ForgotPasswordAuthDto,
  InitialUserProfileUpdateDto,
  LoginAuthDto,
  RequestEmailVerificationAuthDto,
  ResendEmailAuthDto,
  ResetPasswordAuthDto,
  UpdateUserFavouriteGenresDto,
  UpdateUserTypeAuthDto,
  UploadDto,
  VerifyEmailAuthDto,
  VerifyInviteCodeDto,
} from './dto/auth_dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/config/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/config/roles.guard';
import { multerConfig } from 'src/uploader/multer.config';

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

  @Patch('reset-password')
  async resetPassword(
    @Body(new JoiValidationPipe(ResetPasswordSchemaValidator))
    dto: ResetPasswordAuthDto,
  ) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-user-type')
  async updateUserType(
    @Body(new JoiValidationPipe(UpdateUserTypeSchemaValidator))
    dto: UpdateUserTypeAuthDto,
    @Req() req,
  ) {
    return this.authService.updateUserType(req.user.userId, dto.isArtist);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('verify-invite-code')
  @Roles('user')
  async verifyInviteCodeForUser(
    @Body(new JoiValidationPipe(VerifyArtistInviteCodeSchemaValidator))
    dto: VerifyInviteCodeDto,
    @Req() req,
  ) {
    return this.authService.verifyArtistInviteCode(
      req.user.userId,
      dto.inviteCode,
    );
  }

  @Patch('initial-user-update-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateProfile(
    @Req() req,
    @Body(new JoiValidationPipe(InitialUserProfileUpdateSchemaValidator))
    dto: InitialUserProfileUpdateDto,
  ) {
    return this.authService.updateUserProfile(req.user.userId, dto);
  }

  @Patch('update-genres')
  @UseGuards(JwtAuthGuard)
  async updateGenres(
    @Req() req,
    @Body(new JoiValidationPipe(UpdateUserFavouriteGenresValidator))
    body: UpdateUserFavouriteGenresDto,
  ) {
    return this.authService.updateFavoriteGenres(req.user.userId, body);
  }

  @Post('upload-return-url')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.authService.uploadTest(file);
  }

  //  @UseGuards(JwtAuthGuard)
  //   @Post('upload-file-saver')
  //   @UseInterceptors(FileInterceptor('file'))
  //   async uploadFileSaver(
  //     @UploadedFile() file: Express.Multer.File,
  //     @Body() dto: UploadDto,
  //      @Req() req,
  //   ) {
  //     return this.authService.uploadFileSave(req.user.id, file, dto.purpose);
  //   }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('set-artist-profile')
  @Roles('artist')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async artistProfileSetup(
    @UploadedFile() file: Express.Multer.File,
    @Body(new JoiValidationPipe(UpdateArtistProfileSchemaValidator))
    dto: ArtistProfilesetterDto,
    @Req() req,
  ) {
    return this.authService.setupArtistProfile(req.user.userId, file, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return this.authService.getProfileDetails(req.user.userId);
  }
}
