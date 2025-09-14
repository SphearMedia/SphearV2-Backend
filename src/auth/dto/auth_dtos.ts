import { GenreEnum } from 'src/enums/track.data.enums';
import { GenderEnum } from 'src/enums/user.enum';

export class RequestEmailVerificationAuthDto {
  email: string;
}

export class VerifyEmailAuthDto {
  email: string;
  code: string;
}

export class CreateAccountAuthDto {
  email: string;
  password: string;
  //deviceToken?: string;
}

export class LoginAuthDto {
  email: string;
  password: string;
  //deviceToken?: string;
}

export class ResendEmailAuthDto {
  email: string;
}

export class ForgotPasswordAuthDto {
  email: string;
}

export class ResetPasswordAuthDto {
  email: string;
  newPassword: string;
  code: string;
}

export class UpdateUserTypeAuthDto {
  isArtist: boolean;
}

export class UploadDto {
  purpose: string;
}

export class ArtistProfilesetterDto {
  fullName: string;
  stageName: string;
}

export class VerifyInviteCodeDto {
  inviteCode: string;
}

export class InitialUserProfileUpdateDto {
  fullName: string;
  dateOfBirth: {
    day: number;
    month: number;
    year: number;
  };
  gender: GenderEnum;
}

export class UpdateUserFavouriteGenresDto {
  favoriteGenres: GenreEnum[];
}
