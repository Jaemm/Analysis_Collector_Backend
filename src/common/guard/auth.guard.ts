import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../exceptions/error-codes';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.authService.getTokenFromRequest(request);

    if (!token) {
      throw new AppException(
        ErrorCodes.AUTH_HEADER_MISSING,
        'Authorization header missing or invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = this.authService.verifyToken(token);
    return true;
  }
}
