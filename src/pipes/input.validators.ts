import * as Joi from 'joi';

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