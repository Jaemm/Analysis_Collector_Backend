import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { AppException } from '../../exceptions/app.exception';
import { ErrorCodes } from '../../exceptions/error-codes';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.authService.getTokenFromRequest(request);

    if (!token) {
      throw new AppException(
        ErrorCodes.AUTH_HEADER_MISSING,
        'Authorization header missing or invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      request.user = this.authService.verifyToken(token);
      return true;
    } catch (e) {
      this.logger.error('Invalid token');
      throw new AppException(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
