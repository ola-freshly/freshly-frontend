import type { ApiError } from '@/api/types';

export function getErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e && 'statusCode' in e) {
    return (e as ApiError).message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return fallback;
}
