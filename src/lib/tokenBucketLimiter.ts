import type { Request, Response, NextFunction } from "express";
import { RateLimiter } from "limiter";

// Store one bucket per IP (or user ID)
const limiters = new Map<string, RateLimiter>();

export function createTokenBucketLimiterMiddleware(
  tokensPerInterval: number,
  interval: "second" | "minute" | "hour" | number, // e.g. 10 tokens per minute
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "global";
    console.log("Key", key);

    // Create a new bucket for this IP if we haven't seen it yet
    if (!limiters.has(key)) {
      limiters.set(key, new RateLimiter({ tokensPerInterval, interval }));
    }

    const limiter = limiters.get(key)!;

    // Try to spend 1 token on this request
    if (limiter.tryRemoveTokens(1)) {
      next(); // token available, let the request through
    } else {
      res.status(429).json({
        error: "Too Many Requests",
        message: "Too many requests, please try again later.",
      });
    }
  };
}
