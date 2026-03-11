import sharp from "sharp";
import type { AllowedMimeType } from "./image-validator";

const MAX_DIMENSION = 2048;

const SHARP_FORMAT: Record<AllowedMimeType, keyof sharp.FormatEnum> = {
	"image/jpeg": "jpeg",
	"image/png": "png",
	"image/webp": "webp",
};

export interface NormalizedImage {
	buffer: Buffer;
	width: number;
	height: number;
	mimeType: AllowedMimeType;
}

export async function normalizeImage(buffer: Buffer, mimeType: AllowedMimeType): Promise<NormalizedImage> {
	const pipeline = sharp(buffer).rotate();

	const metadata = await pipeline.metadata();
	const width = metadata.width ?? 0;
	const height = metadata.height ?? 0;

	if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
		pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true });
	}

	const format = SHARP_FORMAT[mimeType];
	pipeline.toFormat(format);

	const outputBuffer = await pipeline.toBuffer();
	const outputMeta = await sharp(outputBuffer).metadata();

	return {
		buffer: outputBuffer,
		width: outputMeta.width ?? 0,
		height: outputMeta.height ?? 0,
		mimeType,
	};
}
