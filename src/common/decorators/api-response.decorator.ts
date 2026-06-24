import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDTO } from '../dto/api-response.dto';

export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  status = HttpStatus.OK,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDTO, model),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDTO) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};
