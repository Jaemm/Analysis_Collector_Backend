import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AppLogger } from '../logger/logger.service';
import { ErrorCodes } from '../exceptions/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  private readonly suspiciousPathPatterns = [
    /\/vendor\/phpunit\//i,
    /\/phpunit\//i,
    /\/index\.php\?/i,
    /\\think\\/i,
    /\/containers\/json$/i,
    /\/wp-admin/i,
    /\/wp-login\.php/i,
    /\/\.env(?:\.|$|\/)?/i,
    /\/\.git(?:\/|$)/i,
    /\/\.aws(?:\/|$)/i,
    /\/docker-compose(?:\.[^/]+)?\.ya?ml$/i,
    /\/config(?:\.json|\/)/i,
    /\/boaform\//i,
    /\/actuator\//i,
  ];

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let resBody: any;

    if (exception instanceof HttpException) {
      resBody = this.normalizeHttpException(exception, request.requestId);
    } else {
      resBody = {
        success: false,
        requestId: request.requestId || '-',
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: exception.message || 'Internal server error.',
        },
      };
    }

    const payload: Record<string, unknown> = {
      method: request.method,
      path: request.originalUrl || request.url,
      status,
      ip: this.extractClientIp(request),
      userAgent: request.headers['user-agent'] || '-',
      requestId: request.requestId || '-',
      error: resBody,
    };

    const body = this.maskBody(request.body);
    if (body && Object.keys(body).length) {
      payload.body = body;
    }

    if (request.user?.id) {
      payload.userId = request.user.id;
    }

    if (request.user?.app_id) {
      payload.appId = request.user.app_id;
    }

    if (
      status < HttpStatus.INTERNAL_SERVER_ERROR &&
      this.shouldSkipClientErrorLog(request)
    ) {
      response.status(status).json(resBody);
      return;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(JSON.stringify(payload), exception.stack);
    } else {
      this.logger.warn(JSON.stringify(payload));
    }

    response.status(status).json(resBody);
  }

  private normalizeHttpException(exception: HttpException, requestId?: string) {
    const raw = exception.getResponse();

    if (this.isNormalizedErrorBody(raw)) {
      return {
        requestId: requestId || '-',
        ...raw,
      };
    }

    if (exception instanceof BadRequestException) {
      return this.normalizeBadRequest(raw, requestId);
    }

    if (exception instanceof UnauthorizedException) {
      return {
        success: false,
        requestId: requestId || '-',
        error: {
          code: this.resolveUnauthorizedCode(raw),
          message: this.extractMessage(raw, 'Authentication failed.'),
        },
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        success: false,
        requestId: requestId || '-',
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: this.extractMessage(raw, 'Resource not found.'),
        },
      };
    }

    return {
      success: false,
      requestId: requestId || '-',
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: this.extractMessage(raw, 'Unexpected error occurred.'),
      },
    };
  }

  private normalizeBadRequest(raw: unknown, requestId?: string) {
    const message = this.extractMessage(raw, 'Invalid request.');

    if (
      typeof raw === 'object' &&
      raw !== null &&
      'message' in raw &&
      Array.isArray((raw as { message?: unknown }).message)
    ) {
      const details = ((raw as { message: string[] }).message || []).map(
        (reason) => ({
          field: this.extractFieldName(reason),
          reasons: [reason],
        }),
      );

      return {
        success: false,
        requestId: requestId || '-',
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Request validation failed.',
          details,
        },
      };
    }

    return {
      success: false,
      requestId: requestId || '-',
      error: {
        code: ErrorCodes.INVALID_PARAMETER,
        message,
      },
    };
  }

  private resolveUnauthorizedCode(raw: unknown) {
    const message = this.extractMessage(raw, '');

    if (message === 'Authorization header missing or invalid.') {
      return ErrorCodes.AUTH_HEADER_MISSING;
    }

    if (message === 'JWT secret is not configured.') {
      return ErrorCodes.AUTH_CONFIG_MISSING;
    }

    return ErrorCodes.AUTH_TOKEN_INVALID;
  }

  private extractMessage(raw: unknown, fallback: string) {
    if (typeof raw === 'string') {
      return this.ensurePeriod(raw);
    }

    if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const message = (raw as { message?: unknown }).message;

      if (typeof message === 'string') {
        return this.ensurePeriod(message);
      }

      if (Array.isArray(message) && typeof message[0] === 'string') {
        return this.ensurePeriod(message[0]);
      }
    }

    return fallback;
  }

  private ensurePeriod(message: string) {
    return /[.!?]$/.test(message) ? message : `${message}.`;
  }

  private extractFieldName(reason: string) {
    const [field] = reason.split(' ');
    return field || 'unknown';
  }

  private isNormalizedErrorBody(raw: unknown): raw is {
    success: false;
    error: { code: string; message: string; details?: unknown };
  } {
    return (
      typeof raw === 'object' &&
      raw !== null &&
      'success' in raw &&
      'error' in raw
    );
  }

  private shouldSkipClientErrorLog(request: any): boolean {
    const path = request.originalUrl || request.url || '';
    return this.suspiciousPathPatterns.some((pattern) => pattern.test(path));
  }

  private extractClientIp(request: {
    ip?: string;
    ips?: string[];
    headers?: Record<string, string | string[] | undefined>;
  }): string {
    const xForwardedFor = request.headers?.['x-forwarded-for'];
    const forwarded = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor;

    const forwardedIp = forwarded?.split(',')[0]?.trim();
    if (forwardedIp) {
      return forwardedIp;
    }

    const xRealIp = request.headers?.['x-real-ip'];
    const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    if (realIp?.trim()) {
      return realIp.trim();
    }

    if (request.ips?.length) {
      return request.ips[0];
    }

    return request.ip || '-';
  }

  private maskBody(body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return undefined;
    }

    const clone = { ...(body as Record<string, unknown>) };

    if (clone.password) clone.password = '***';
    if (clone.new_password) clone.new_password = '***';
    if (clone.refresh_token) clone.refresh_token = '***';
    if (clone.token) clone.token = '***';

    return clone;
  }
}
