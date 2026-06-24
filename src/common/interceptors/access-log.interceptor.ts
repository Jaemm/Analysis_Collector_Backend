import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  private readonly skippedPathPrefixes = [
    '/health',
    '/docs',
    '/docs-json',
    '/favicon.ico',
  ];

  private shouldSkipLogging(request: Request, statusCode: number): boolean {
    if (statusCode >= 400) {
      return true;
    }

    if (request.method === 'OPTIONS') {
      return true;
    }

    const path = request.path || request.originalUrl || '';
    return this.skippedPathPrefixes.some((prefix) => path.startsWith(prefix));
  }

  private extractLocale(request: Request) {
    const raw =
      request.headers['x-local'] ||
      request.headers['x-locale'] ||
      request.headers['x-chowis-locale'];

    if (!raw) {
      return undefined;
    }

    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.toLowerCase();
  }

  private extractClientIp(request: Request) {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const forwardedIp = forwardedValue?.split(',')[0]?.trim();

    if (forwardedIp) {
      return forwardedIp;
    }

    const realIp = request.headers['x-real-ip'];
    const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;

    if (realIpValue?.trim()) {
      return realIpValue.trim();
    }

    if (request.ips?.length) {
      return request.ips[0];
    }

    return request.ip;
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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl } = request;
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;

          if (this.shouldSkipLogging(request, response.statusCode)) {
            return;
          }

          const payload: Record<string, unknown> = {
            method,
            path: originalUrl,
            status: response.statusCode,
            durationMs: duration,
            userId: user?.id,
            appId: user?.app_id,
            ip: this.extractClientIp(request),
            locale: this.extractLocale(request) ?? '-',
            userAgent: request.get('user-agent') || '-',
            requestId: request.requestId || '-',
          };

          const body = this.maskBody(request.body);
          if (body && Object.keys(body).length) {
            payload.body = body;
          }

          this.logger.log(JSON.stringify(payload));
        },
      }),
    );
  }
}
