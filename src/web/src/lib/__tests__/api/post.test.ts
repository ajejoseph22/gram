import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPost, getPosts } from "../../api/post.ts";

vi.mock("../../api/client.ts", () => ({
	client: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

import { client } from "../../api/client.ts";

const mockGet = vi.mocked(client.get);
const mockPost = vi.mocked(client.post);

describe("getPosts", () => {
	afterEach(() => vi.clearAllMocks());

	beforeEach(() => mockGet.mockResolvedValue({ data: { data: [], nextCursor: null } }));

	it("should call GET /post correctly with no params", async () => {
		await getPosts();

		expect(mockGet).toHaveBeenCalledWith("/post", { params: {} });
	});

	it("should pass cursor and joined tags as query params", async () => {
		await getPosts("abc123", ["cats", "dogs"]);

		expect(mockGet).toHaveBeenCalledWith("/post", {
			params: { cursor: "abc123", tags: "cats,dogs" },
		});
	});
});

describe("createPost", () => {
	afterEach(() => vi.clearAllMocks());

	it("should POST /post with the FormData", async () => {
		const formData = new FormData();
		formData.append("title", "hello");
		mockPost.mockResolvedValue({ data: { id: "1", title: "hello", tags: [], images: [] } });

		const result = await createPost(formData);

		expect(mockPost).toHaveBeenCalledWith("/post", formData);
		expect(result.title).toBe("hello");
	});
});
