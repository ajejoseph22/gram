import type { Prisma } from "@prisma/client";
import { prisma } from "src/api/infra/db/client";

export interface FeedCursor {
	createdAt: Date;
	id: string;
}

export async function getFeedPosts(limit: number, cursor?: FeedCursor) {
	const where: Prisma.PostWhereInput = cursor
		? {
				OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
			}
		: {};

	return prisma.post.findMany({
		where,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1, // take 1 extra to see if there are more
		select: {
			id: true,
			title: true,
			createdAt: true,
			mediaAssets: {
				orderBy: { position: "asc" },
				select: {
					storagePath: true,
					width: true,
					height: true,
				},
			},
			postTags: {
				select: {
					tag: {
						select: { slug: true },
					},
				},
			},
		},
	});
}

interface ProcessedImage {
	filePublicPath: string;
	mimeType: string;
	width: number;
	height: number;
}

interface CreatePostData {
	title: string;
	tags: string[];
	images: ProcessedImage[];
}

export async function createPost({ title, tags, images }: CreatePostData) {
	return prisma.$transaction(async (tx) => {
		const post = await tx.post.create({
			data: {
				title,
				titleNormalized: title.toLowerCase(),
				mediaAssets: {
					create: images.map((img, i) => ({
						position: i,
						storagePath: img.filePublicPath,
						mimeType: img.mimeType,
						width: img.width,
						height: img.height,
					})),
				},
			},
			select: {
				id: true,
				title: true,
				createdAt: true,
			},
		});

		if (tags.length) {
			await tx.tag.createMany({
				data: tags.map((slug) => ({ slug, displayName: slug })),
				skipDuplicates: true,
			});

			const tagRecords = await tx.tag.findMany({
				where: { slug: { in: tags } },
				select: { id: true },
			});

			await tx.postTag.createMany({
				data: tagRecords.map((t) => ({ postId: post.id, tagId: t.id })),
			});
		}

		return post;
	});
}
