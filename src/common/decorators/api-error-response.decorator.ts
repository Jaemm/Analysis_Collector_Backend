import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDTO } from '../dto/error-response.dto';

export function ApiCommonErrorResponses() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDTO),
    ApiBadRequestResponse({
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDTO) },
          examples: {
            validationError: {
              summary: 'Validation error',
              value: {
                success: false,
                requestId: 'a1b2c3d4',
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Request validation failed.',
                  details: [
                    {
                      field: 'customer_id',
                      reasons: [
                        'customer_id must match /^\\d+$/ regular expression',
                      ],
                    },
                  ],
                },
              },
            },
            invalidParameter: {
              summary: 'Invalid parameter',
              value: {
                success: false,
                requestId: 'a1b2c3d4',
                error: {
                  code: 'INVALID_PARAMETER',
                  message: 'Invalid request.',
                },
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDTO) },
          examples: {
            missingAuthHeader: {
              summary: 'Missing authorization header',
              value: {
                success: false,
                requestId: 'a1b2c3d4',
                error: {
                  code: 'AUTH_HEADER_MISSING',
                  message: 'Authorization header missing or invalid.',
                },
              },
            },
            invalidToken: {
              summary: 'Invalid token',
              value: {
                success: false,
                requestId: 'a1b2c3d4',
                error: {
                  code: 'AUTH_TOKEN_INVALID',
                  message: 'Invalid token.',
                },
              },
            },
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponseDTO) },
          examples: {
            internalError: {
              summary: 'Unhandled server error',
              value: {
                success: false,
                requestId: 'a1b2c3d4',
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Internal server error.',
                },
              },
            },
          },
        },
      },
    }),
  );
}
