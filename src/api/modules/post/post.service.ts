import fs from "node:fs/promises";
import { normalizeImage } from "@api/modules/post/utils/images/image-normalizer";
import { validateImage } from "@api/modules/post/utils/images/image-validator";
import { deleteTempFile, writeFile } from "@api/modules/post/utils/images/storage-adapter";
import { createPost as createPostInDB } from "./post.repository";

interface CreatePostInput {
	title: string;
	tags: string[];
	tmpFilePaths: string[];
}

async function processImage(filePath: string) {
	try {
		const fileBuffer = await fs.readFile(filePath);
		const { mimeType } = await validateImage(fileBuffer);
		const normalizedImage = await normalizeImage(fileBuffer, mimeType);
		const filePublicPath = await writeFile(normalizedImage.buffer, normalizedImage.mimeType);

		return {
			filePublicPath,
			mimeType: normalizedImage.mimeType,
			width: normalizedImage.width,
			height: normalizedImage.height,
		};
	} finally {
		await deleteTempFile(filePath);
	}
}

export async function createPost({ title, tags, tmpFilePaths }: CreatePostInput) {
	const processImagePromises = [];

	for (const filePath of tmpFilePaths) {
		processImagePromises.push(processImage(filePath));
	}

	const processedImages = await Promise.all(processImagePromises);

	const dedupedTags = [...new Set(tags)];

	const post = await createPostInDB({ title, tags: dedupedTags, images: processedImages });

	return {
		id: post.id,
		title: post.title,
		createdAt: post.createdAt,
		tags: dedupedTags,
		images: processedImages.map((img) => ({ url: img.filePublicPath, width: img.width, height: img.height })),
	};
}
