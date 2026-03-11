import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { env } from "src/api/infra/config/env.config";

const rateLimiter = rateLimit({
	legacyHeaders: true,
	limit: env.RATE_LIMIT_MAX_REQUESTS,
	message: "Too many requests, please try again later.",
	standardHeaders: true,
	windowMs: env.RATE_LIMIT_WINDOW_MS,
	keyGenerator: (req: Request) => ipKeyGenerator(req.ip as string),
});

export default rateLimiter;
