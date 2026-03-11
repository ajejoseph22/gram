import { env } from "src/api/infra/config/env.config";
import { openAPIRouter } from "src/api/modules/api-docs/open-api.router";
import { healthCheckRouter } from "src/api/modules/health-check/health-check.router";
import errorHandler from "src/api/server/middleware/error.middleware";
import rateLimiter from "src/api/server/middleware/rate-limit.middleware";
import requestLogger from "src/api/server/middleware/request-logger.middleware";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

const app: Express = express();

// Trust reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Static files
app.use("/uploads", express.static(env.UPLOAD_DIR_ABSOLUTE));

// Routes
app.use("/health-check", healthCheckRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app };
