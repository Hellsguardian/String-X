/**
 * API and Service Response wrappers
 */

export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

export function successResult<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function errorResult<T>(message: string, code?: string, details?: unknown): ServiceResult<T> {
  return {
    data: null,
    error: {
      message,
      code,
      details,
    },
  };
}
