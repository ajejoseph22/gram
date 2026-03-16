import { env } from "@api/infra/config/env.config";
import { ImageValidationError, validateImage } from "../../../utils/images/image-validator";

// Minimal valid file headers (magic bytes)
const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

const PNG_BUFFER = Buffer.from([
	// PNG signature
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	// IHDR chunk: length(13) + "IHDR" + 1x1 8-bit RGB + CRC
	0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00,
	0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
]);

const WEBP_BUFFER = Buffer.from([
	0x52,
	0x49,
	0x46,
	0x46, // RIFF
	0x00,
	0x00,
	0x00,
	0x00, // file size (placeholder)
	0x57,
	0x45,
	0x42,
	0x50, // WEBP
]);

describe("validateImage", () => {
	it.each([
		["JPEG", JPEG_BUFFER, "image/jpeg"],
		["PNG", PNG_BUFFER, "image/png"],
		["WebP", WEBP_BUFFER, "image/webp"],
	])("should accept a valid %s buffer", async (_type, buffer, mimeType) => {
		const result = await validateImage(buffer);

		expect(result.mimeType).toBe(mimeType);
	});

	it("should reject a buffer that exceeds MAX_UPLOAD_SIZE_BYTES", async () => {
		const oversized = Buffer.alloc(env.MAX_UPLOAD_SIZE_BYTES + 1);

		await expect(validateImage(oversized)).rejects.toThrow(ImageValidationError);
		await expect(validateImage(oversized)).rejects.toThrow(/exceeds maximum size/);
	});

	it("should reject an empty buffer", async () => {
		const empty = Buffer.alloc(0);

		await expect(validateImage(empty)).rejects.toThrow(ImageValidationError);
	});

	it("should reject a non-image buffer", async () => {
		const textBuffer = Buffer.from("This is a plain text file, not an image.");

		await expect(validateImage(textBuffer)).rejects.toThrow(ImageValidationError);
		await expect(validateImage(textBuffer)).rejects.toThrow(/Unsupported file type/);
	});
});
