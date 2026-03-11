import axios from "axios";
import { env } from "./env";

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

const client = axios.create({
	baseURL: env.VITE_API_BASE_URL,
});

client.interceptors.response.use(
	(response) => response,
	(error) => {
		const serverMessage = error.response?.data?.error?.message;
		if (serverMessage) {
			return Promise.reject(new Error(serverMessage));
		}
		return Promise.reject(error);
	},
);

export async function createPost(formData: FormData): Promise<Post> {
	const { data } = await client.post<Post>("/post", formData);
	return data;
}
