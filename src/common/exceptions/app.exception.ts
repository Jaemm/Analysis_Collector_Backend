import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    details?: unknown,
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          ...(details !== undefined ? { details } : {}),
        },
      },
      status,
    );
  }
}
