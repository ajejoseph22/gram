import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@api/infra/config/env.config";
import type { AllowedMimeType } from "@api/modules/post/utils/images/image-validator";

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

	return path.posix.join(env.UPLOAD_PUBLIC_PATH, filename);
}

export async function deleteTempFile(filePath?: string) {
	if (!filePath) return;

	try {
		await fs.unlink(filePath);
	} catch {
		// No worries. Cron job will clean up files in the temp directory after a certain period
	}
}
