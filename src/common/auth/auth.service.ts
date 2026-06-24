import { Injectable, HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../exceptions/error-codes';
import { AppLogger } from '../logger/logger.service';
import { StagingMasterTokenResponseDto } from './dto/staging-master-token-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly logger: AppLogger) {}

  issueStagingMasterToken(): StagingMasterTokenResponseDto {
    if (!this.isStagingMasterTokenEnabled()) {
      throw new AppException(
        ErrorCodes.AUTH_STAGING_ONLY,
        'This API is only available in staging.',
        HttpStatus.FORBIDDEN,
      );
    }

    const secret = this.getAccessTokenSecret();

    if (!secret) {
      throw new AppException(
        ErrorCodes.AUTH_CONFIG_MISSING,
        'JWT secret is not configured.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const expiresIn = 60 * 60 * 24 * 7;
    const payload = {
      sub: '0',
      id: '0',
      email: 'staging-master@chowis.com',
      app_id: '0',
      appId: '0',
      role: 'master',
      is_master: true,
      isMaster: true,
    };

    const accessToken = jwt.sign(payload, secret, {
      expiresIn,
    });

    return {
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: expiresIn,
      consultant_id: payload.id,
      consultant_email: payload.email,
      app_id: payload.app_id,
      is_master: true,
    };
  }

  verifyToken(token: string) {
    const secret = this.getAccessTokenSecret();

    if (!secret) {
      throw new AppException(
        ErrorCodes.AUTH_CONFIG_MISSING,
        'JWT secret is not configured.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      return jwt.verify(token, secret, this.getVerifyOptions());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      this.logger.warn('JWT verification failed', {
        reason,
        issuer: process.env.APP_ID || '-',
        audience: process.env.DOMAIN || '-',
        secretSource: process.env.CRM_ACCESS_TOKEN_SECRET
          ? 'CRM_ACCESS_TOKEN_SECRET'
          : 'JWT_SECRET',
      });

      throw new AppException(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  getTokenFromRequest(request: Request): string | undefined {
    const candidates = [
      request.headers['x-chowis-consultant-token'],
      request.headers['x-chowis-token'],
      request.headers.authorization,
    ];

    for (const candidate of candidates) {
      const token = this.normalizeToken(candidate);
      if (token) {
        return token;
      }
    }

    return undefined;
  }

  private getAccessTokenSecret(): string | undefined {
    return process.env.CRM_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  }

  private isStagingMasterTokenEnabled(): boolean {
    const appEnv = (process.env.APP_ENV || '').trim().toLowerCase();
    const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
    const explicitFlag = (process.env.STAGING_MASTER_TOKEN_ENABLED || '')
      .trim()
      .toLowerCase();

    return (
      explicitFlag === 'true' ||
      explicitFlag === '1' ||
      appEnv === 'staging' ||
      nodeEnv === 'staging'
    );
  }

  private getVerifyOptions(): jwt.VerifyOptions {
    return {};
  }

  private normalizeToken(
    value: string | string[] | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const rawValue = Array.isArray(value) ? value[0] : value;
    const trimmedValue = rawValue?.trim();

    if (
      !trimmedValue ||
      trimmedValue === 'null' ||
      trimmedValue === 'undefined'
    ) {
      return undefined;
    }

    const unquotedInput = trimmedValue.replace(/^['"]|['"]$/g, '').trim();
    const withoutBearer = unquotedInput.replace(/^(Bearer\s+)+/i, '').trim();
    const unquotedValue = withoutBearer.replace(/^['"]|['"]$/g, '').trim();

    return unquotedValue || undefined;
  }
}
