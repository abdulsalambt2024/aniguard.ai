export interface RateLimiterOptions {
  limit?: number;
  windowMs?: number;
  maxTrackedUsers?: number;
  now?: () => number;
}

export interface RateLimiter {
  allow(userId: string): boolean;
  readonly size: number;
}

export function createRateLimiter(options?: RateLimiterOptions): RateLimiter;
export function allowAssistantRequest(userId: string): boolean;
