import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const apiPackageRoot = fileURLToPath(new URL("../../../", import.meta.url));

dotenv.config({ path: path.resolve(apiPackageRoot, ".env") });

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const databaseUrlSchema = z
	.string()
	.url()
	.refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), {
		message: "DATABASE_URL must use the postgres or postgresql scheme",
	});

export const apiEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	HOST: z.string().min(1).default("localhost"),
	PORT: z.coerce.number().int().positive().default(8080),
	CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
	SOCKET_PATH: z.string().min(1).transform(ensureLeadingSlash).default("/socket.io"),

	// Rate Limiter
	RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
	RATE_LIMIT_WINDOW_MS: z.coerce
		.number()
		.int()
		.positive()
		.default(15 * 60 * 1000),

	// PostgreSQL
	DATABASE_URL: databaseUrlSchema.default("postgresql://postgres:postgres@localhost:5432/gram"),

	// Uploads
	UPLOAD_DIR: z.string().min(1).default("./uploads"),
	MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(rawEnv: NodeJS.ProcessEnv): ApiEnv {
	const parsedEnv = apiEnvSchema.safeParse(rawEnv);

	if (!parsedEnv.success) {
		console.error("Invalid environment variables:", parsedEnv.error.format());
		throw new Error("Invalid environment variables");
	}

	return parsedEnv.data;
}

const parsedEnv = parseApiEnv(process.env);

export const env = {
	...parsedEnv,
	MAX_UPLOAD_SIZE_BYTES: Math.floor(parsedEnv.MAX_UPLOAD_SIZE_MB * 1024 * 1024),
	UPLOAD_DIR_ABSOLUTE: path.resolve(apiPackageRoot, parsedEnv.UPLOAD_DIR),
	isDevelopment: parsedEnv.NODE_ENV === "development",
	isProduction: parsedEnv.NODE_ENV === "production",
	isTest: parsedEnv.NODE_ENV === "test",
};
