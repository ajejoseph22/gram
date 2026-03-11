import { z } from "zod";

const normalizeTag = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

export const postBodySchema = z.object({
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

export type PostBody = z.infer<typeof postBodySchema>;
