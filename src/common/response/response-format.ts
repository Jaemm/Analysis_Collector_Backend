export type SuccessResponse<T> = {
  success: true;
  requestId?: string;
  message?: string;
  data: T;
};

export type FailureResponse = {
  success: false;
  requestId?: string;
  message: string;
  error: unknown;
};

export function buildSuccessResponse<T>(
  data: T,
  message?: string,
): SuccessResponse<T> {
  return {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
}

export function buildFailureResponse(
  message: string,
  error: unknown,
): FailureResponse {
  return {
    success: false,
    message,
    error,
  };
}

export function isSuccessResponse<T = unknown>(
  value: unknown,
): value is SuccessResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success?: unknown }).success === true &&
    'data' in value
  );
}
