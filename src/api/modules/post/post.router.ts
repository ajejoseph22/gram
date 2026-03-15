import { z } from "@api/modules/api-docs/open-api.zod";
import { getPostsQuerySchema } from "@api/modules/post/validators/post.schema";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { createPost, getPosts } from "./post.controller";
import { validateCreatePostRequest, validateGetPostsRequest } from "./post.middleware";

export const postRegistry = new OpenAPIRegistry();
export const postRouter: Router = express.Router();

postRegistry.registerPath({
	method: "post",
	path: "/post",
	tags: ["Posts"],
	summary: "Create a post with images, title, and tags",
	requestBody: {
		required: true,
		content: {
			"multipart/form-data": {
				schema: {
					type: "object",
					required: ["images", "title"],
					properties: {
						images: {
							type: "array",
							items: { type: "string", format: "binary" },
							description: "Image files (max 5)",
						},
						title: { type: "string", maxLength: 120, description: "Post title" },
						tags: { type: "string", description: "Comma-separated tags" },
					},
				},
			},
		},
	},
	responses: {
		201: {
			description: "Post created",
			content: {
				"application/json": {
					schema: z.object({
						data: z.object({
							id: z.string().uuid(),
							title: z.string(),
							createdAt: z.string().datetime(),
							tags: z.array(z.string()),
							images: z.array(
								z.object({
									url: z.string(),
									width: z.number(),
									height: z.number(),
								}),
							),
						}),
					}),
				},
			},
		},
		400: {
			description: "Validation error",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
					}),
				},
			},
		},
	},
});

postRegistry.registerPath({
	method: "get",
	path: "/post",
	tags: ["Posts"],
	summary: "Get paginated feed of posts in reverse-chronological order",
	request: {
		query: getPostsQuerySchema,
	},
	responses: {
		200: {
			description: "Feed page",
			content: {
				"application/json": {
					schema: z.object({
						data: z.array(
							z.object({
								id: z.string().uuid(),
								title: z.string(),
								createdAt: z.string().datetime(),
								tags: z.array(z.string()),
								images: z.array(
									z.object({
										url: z.string(),
										width: z.number(),
										height: z.number(),
									}),
								),
							}),
						),
						nextCursor: z.string().nullable(),
					}),
				},
			},
		},
	},
});

postRouter.get("/", validateGetPostsRequest, getPosts);
postRouter.post("/", validateCreatePostRequest, createPost);
