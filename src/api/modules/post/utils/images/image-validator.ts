import { fileTypeFromBuffer } from "file-type";
import { env } from "@api/infra/config/env.config";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export async function validateImage(buffer: Buffer): Promise<{ mimeType: AllowedMimeType }> {
	if (buffer.length > env.MAX_UPLOAD_SIZE_BYTES) {
		throw new ImageValidationError(`File exceeds maximum size of ${env.MAX_UPLOAD_SIZE_MB}MB`);
	}

	const fileTypeResult = await fileTypeFromBuffer(buffer);
	if (!fileTypeResult || !ALLOWED_MIME_TYPES.includes(fileTypeResult.mime as AllowedMimeType)) {
		throw new ImageValidationError(`Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
	}

	return { mimeType: fileTypeResult.mime as AllowedMimeType };
}

export class ImageValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ImageValidationError";
	}
}