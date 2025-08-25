import * as Joi from 'joi';

export const RegisterSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  password: Joi.string().required(),
  referralCode: Joi.string().optional(),
  deviceToken: Joi.string().optional(),
});

export const LoginSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  deviceToken: Joi.string().optional(),
});

export const createReferralCodeSchemaValidator = Joi.object({
  code: Joi.string().min(4).max(14).required(),
});

export const sendAssetSchemaValidator = Joi.object({
  recipientAddress: Joi.string()
    .length(56)
    .pattern(/^G[A-Z2-7]{55}$/)
    .required()
    .messages({
      'string.base': 'Recipient address must be a string.',
      'string.length': 'Stellar address must be exactly 56 characters.',
      'string.pattern.base':
        'Invalid Stellar address format. Must start with "G" and use base32 encoding.',
      'any.required': 'Recipient address is required.',
    }),
  assetCode: Joi.string().required(),
  amount: Joi.string().required(),
});

export const UpdateProfileSchemaValidator = Joi.object({
  fullName: Joi.string().min(3).max(20),
  username: Joi.string().min(3).max(20),
}).or('fullName', 'username');

export const purchaseBoosterPerkSchemaValidator = Joi.object({
  tier: Joi.string().valid('bronze', 'silver', 'gold').required().messages({
    'any.only': 'Tier must be one of: bronze, silver, gold.',
    'any.required': 'Tier is required.',
  }),
});
