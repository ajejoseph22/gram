import { z } from "zod";

const normalizeTag = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

export const createPostBodySchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
	tags: z
		.string()
		.optional()
		.default("")
		.transform((value) =>
			value
				.split(",")
				.map(normalizeTag)
				.filter((t) => t.length > 0),
		)
		.pipe(z.array(z.string().max(24, "Each tag must be 24 characters or fewer")).max(10, "Maximum 10 tags allowed")),
});

export const getPostsQuerySchema = z.object({
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	tags: z
		.string()
		.optional()
		.transform((value) =>
			value
				? value
						.split(",")
						.map(normalizeTag)
						.filter((t) => t.length)
				: undefined,
		),
});

export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
export type CreatePostBody = z.infer<typeof createPostBodySchema>;
