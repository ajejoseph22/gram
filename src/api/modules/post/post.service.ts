import { normalizeImage } from "@api/modules/post/utils/images/image-normalizer";
import { validateImage } from "@api/modules/post/utils/images/image-validator";
import { writeFile } from "@api/modules/post/utils/images/storage-adapter";
import { createPost as createPostInDB } from "./post.repository";

interface CreatePostInput {
	title: string;
	tags: string[];
	fileBuffers: Buffer[];
}

async function processImage(buffer: Buffer) {
	const { mimeType } = await validateImage(buffer);
	const normalizedImage = await normalizeImage(buffer, mimeType);
	const filePublicPath = await writeFile(normalizedImage.buffer, normalizedImage.mimeType);
	return { filePublicPath, mimeType: normalizedImage.mimeType, width: normalizedImage.width, height: normalizedImage.height };
}

export async function createPost({ title, tags, fileBuffers }: CreatePostInput) {
	const processedImages = await Promise.all(fileBuffers.map(processImage));
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
