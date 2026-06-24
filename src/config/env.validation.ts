import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  PORT: Joi.number().default(3000),
  SWAGGER_ENABLED: Joi.boolean().default(true),

  JWT_SECRET: Joi.string(),
  CRM_ACCESS_TOKEN_SECRET: Joi.string(),
  APP_ENV: Joi.string().optional(),
  STAGING_MASTER_TOKEN_ENABLED: Joi.boolean().optional(),
  APP_ID: Joi.string().optional(),
  DOMAIN: Joi.string().optional(),
  S3_DOWNLOAD_CONCURRENCY: Joi.number().integer().min(1).max(20).default(6),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_BOOTSTRAP_DATABASE: Joi.string().default('postgres'),
  DB_AUTO_CREATE_DATABASE: Joi.boolean().default(true),
  DB_AUTO_MIGRATE: Joi.boolean().default(true),
  DB_SSL: Joi.boolean().default(true),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(false),
  LOGIN_CRM_ANALYSIS_COMPLETE_URL: Joi.string().uri().optional(),
  LOGIN_CRM_INTERNAL_TOKEN: Joi.string().optional(),
  LOGIN_CRM_WEBHOOK_TIMEOUT_MS: Joi.number().integer().min(1000).max(60000).default(10000),
}).or('JWT_SECRET', 'CRM_ACCESS_TOKEN_SECRET');
