import fs from "node:fs/promises";
import { normalizeImage } from "@api/modules/post/utils/images/image-normalizer";
import { validateImage } from "@api/modules/post/utils/images/image-validator";
import { deleteTempFile, writeFile } from "@api/modules/post/utils/images/storage-adapter";
import { getIO } from "@api/server/sockets";
import { SocketEvent } from "@api/server/sockets/events";
import { logger } from "src/api/infra/logger/logger";
import { createPost as createPostInDB, getFeedPosts } from "./post.repository";
import { decodeCursor, encodeCursor } from "./utils/cursor";

export async function getPosts(cursor?: string, limit = 20, tags?: string[]) {
	const feedCursor = cursor ? decodeCursor(cursor) : undefined;
	const rows = await getFeedPosts(limit, feedCursor, tags);

	const hasMore = rows.length > limit;
	const postsForPage = hasMore ? rows.slice(0, limit) : rows;

	const data = postsForPage.map((post) => ({
		id: post.id,
		title: post.title,
		createdAt: post.createdAt,
		tags: post.postTags.map((postTag) => postTag.tag.slug),
		images: post.mediaAssets.map((mediaAsset) => ({
			url: mediaAsset.storagePath,
			width: mediaAsset.width,
			height: mediaAsset.height,
		})),
	}));

	const lastPost = postsForPage[postsForPage.length - 1];
	const nextCursor = hasMore ? encodeCursor(lastPost.createdAt, lastPost.id) : null;

	return { data, nextCursor };
}

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

	const result = {
		id: post.id,
		title: post.title,
		createdAt: post.createdAt,
		tags: dedupedTags,
		images: processedImages.map((img) => ({ url: img.filePublicPath, width: img.width, height: img.height })),
	};

	try {
		getIO().emit(SocketEvent.POST_CREATED, result);
	} catch (err) {
		logger.error({ err }, "Failed to emit feed.post.created event");
	}

	return result;
}
