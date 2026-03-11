import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "src/api/infra/config/env.config";
import type { AllowedMimeType } from "./image-validator";

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

export async function writeFile(buffer: Buffer, mimeType: AllowedMimeType): Promise<string> {
	await fs.mkdir(env.UPLOAD_DIR_ABSOLUTE, { recursive: true });

	const ext = MIME_TO_EXT[mimeType];
	const filename = `${randomUUID()}${ext}`;
	const fullPath = path.join(env.UPLOAD_DIR_ABSOLUTE, filename);

	await fs.writeFile(fullPath, buffer);

	return filename;
}
