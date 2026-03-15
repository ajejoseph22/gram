import fs from "node:fs/promises";
import { normalizeImage } from "@api/modules/post/utils/images/image-normalizer";
import { validateImage } from "@api/modules/post/utils/images/image-validator";
import { deleteTempFile, writeFile } from "@api/modules/post/utils/images/storage-adapter";
import { createPost as createPostInDB, type FeedCursor, getFeedPosts } from "./post.repository";

const CURSOR_SEPARATOR = "_";

function encodeCursor(createdAt: Date, id: string): string {
	return Buffer.from(`${createdAt.toISOString()}${CURSOR_SEPARATOR}${id}`).toString("base64url");
}

function decodeCursor(cursor: string): FeedCursor {
	const decoded = Buffer.from(cursor, "base64url").toString();
	const separatorIndex = decoded.indexOf(CURSOR_SEPARATOR);
	if (separatorIndex === -1) throw new Error("Invalid cursor");

	const createdAt = new Date(decoded.slice(0, separatorIndex));
	const id = decoded.slice(separatorIndex + 1);

	if (Number.isNaN(createdAt.getTime()) || !id) throw new Error("Invalid cursor");

	return { createdAt, id };
}

export async function getPosts(cursor?: string, limit = 20) {
	const feedCursor = cursor ? decodeCursor(cursor) : undefined;
	const rows = await getFeedPosts(limit, feedCursor);

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

	return {
		id: post.id,
		title: post.title,
		createdAt: post.createdAt,
		tags: dedupedTags,
		images: processedImages.map((img) => ({ url: img.filePublicPath, width: img.width, height: img.height })),
	};
}
