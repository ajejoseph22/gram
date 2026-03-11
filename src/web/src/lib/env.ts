import { z } from "zod";

const webEnvSchema = z.object({
	VITE_API_BASE_URL: z.string().url().default("http://localhost:8080"),
	VITE_SOCKET_URL: z.string().url().default("http://localhost:8080"),
	VITE_SOCKET_PATH: z.string().min(1).default("/socket.io"),
	VITE_MAX_UPLOAD_FILE_COUNT: z.coerce.number().int().positive().default(5),
	VITE_MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
});

const parsed = webEnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
	console.error("Invalid environment variables:", parsed.error.format());
	throw new Error("Invalid environment variables");
}

export const env = parsed.data;
