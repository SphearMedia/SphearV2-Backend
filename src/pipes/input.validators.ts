import * as Joi from 'joi';
import { GenreEnum, ProjectTypeEnum } from 'src/enums/track.data.enums';

export const RequestEmailVerificationSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
});

export const VerifyEmailSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

export const CreateAccountSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  //deviceToken: Joi.string().optional(),
});

export const LoginSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  // deviceToken: Joi.string().optional(),
});

export const ResendEmailSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
});

export const ForgotPasswordSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
});

export const ResetPasswordSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().required(),
  code: Joi.string().length(6).required(),
});

export const UpdateUserTypeSchemaValidator = Joi.object({
  isArtist: Joi.boolean().required(),
});

export const UpdateArtistProfileSchemaValidator = Joi.object({
  fullName: Joi.string().required(),
  stageName: Joi.string().required(),
});

export const VerifyArtistInviteCodeSchemaValidator = Joi.object({
  inviteCode: Joi.string().length(6).required(),
});

export const CreateSingleSchemaValidator = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  primaryArtist: Joi.string().trim().min(2).max(100).required(),
  featuredArtists: Joi.array()
    .items(Joi.string().trim().min(2).max(100))
    .default([]),
  isJointRelease: Joi.boolean().default(false),
  genre: Joi.string()
    .valid(...Object.values(GenreEnum))
    .required(),
  coverArtUrl: Joi.string().trim().uri().required(),
  copyright: Joi.string().trim().allow('', null),
  phonographic: Joi.string().trim().allow('', null),
  composer: Joi.string().trim().allow('', null),
  songWriter: Joi.string().trim().allow('', null),
  producer: Joi.string().trim().allow('', null),
  audioFileUrl: Joi.string().trim().uri().required(),
  lyrics: Joi.string().trim().allow('', null),
  releaseDate: Joi.date().iso().required(),
});

export const CreateProjectSchemaValidator = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  type: Joi.string()
    .valid(...Object.values(ProjectTypeEnum))
    .required(),
  primaryArtist: Joi.string().trim().min(2).max(100).required(),
  featuredArtists: Joi.array()
    .items(Joi.string().trim().min(2).max(100))
    .default([]),
  isJointRelease: Joi.boolean().default(false),
  genre: Joi.string()
    .valid(...Object.values(GenreEnum))
    .required(),
  coverArtUrl: Joi.string().trim().uri().required(),
  copyright: Joi.string().trim().allow('', null),
  phonographic: Joi.string().trim().allow('', null),
  releaseDate: Joi.date().iso().required(),
  tracks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().min(2).max(100).required(),
        primaryArtist: Joi.string().trim().min(2).max(100).required(),
        featuredArtists: Joi.array()
          .items(Joi.string().trim().min(2).max(100))
          .default([]),
        isJointRelease: Joi.boolean().default(false),
        genre: Joi.string()
          .valid(...Object.values(GenreEnum))
          .required(),
        coverArtUrl: Joi.string().trim().uri().required(),
        copyright: Joi.string().trim().allow('', null), 
        phonographic: Joi.string().trim().allow('', null),
        composer: Joi.string().trim().allow('', null),
        songWriter: Joi.string().trim().allow('', null),
        producer: Joi.string().trim().allow('', null),
        audioFileUrl: Joi.string().trim().uri().required(),
        lyrics: Joi.string().trim().allow('', null),
        releaseDate: Joi.date().iso().required(),
      }),
    )
    .min(1)
    .required(),
});

export const FollowOrUnfollowArtistSchemaValidator = Joi.object({
  artistId: Joi.string().hex().length(24).required(),
});
