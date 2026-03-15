import { client } from "./api-client";

export interface PostImage {
	url: string;
	width: number;
	height: number;
}

export interface Post {
	id: string;
	title: string;
	createdAt: string;
	tags: string[];
	images: PostImage[];
}

export interface PostsResponse {
	data: Post[];
	nextCursor: string | null;
}

export async function getPosts(cursor?: string, tags?: string[]): Promise<PostsResponse> {
	const params: Record<string, string> = {};
	if (cursor) params.cursor = cursor;
	if (tags?.length) params.tags = tags.join(",");

	const { data } = await client.get<PostsResponse>("/post", { params });
	return data;
}

export async function createPost(formData: FormData): Promise<Post> {
	const { data } = await client.post<Post>("/post", formData);
	return data;
}