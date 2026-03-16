import fs from "node:fs/promises";
import { createPost as createPostInDB, getFeedPosts } from "@api/modules/post/post.repository";
import { encodeCursor } from "@api/modules/post/utils/cursor";
import { normalizeImage } from "@api/modules/post/utils/images/image-normalizer";
import { validateImage } from "@api/modules/post/utils/images/image-validator";
import { deleteTempFile, writeFile } from "@api/modules/post/utils/images/storage-adapter";
import { createPost, getPosts } from "../post.service";

vi.mock("@api/modules/post/post.repository");
vi.mock("@api/modules/post/utils/cursor");
vi.mock("node:fs/promises", () => ({ default: { readFile: vi.fn() } }));
vi.mock("@api/modules/post/utils/images/image-validator");
vi.mock("@api/modules/post/utils/images/image-normalizer");
vi.mock("@api/modules/post/utils/images/storage-adapter");
vi.mock("@api/server/sockets", () => ({ getIO: () => ({ emit: vi.fn() }) }));
vi.mock("src/api/infra/logger/logger", () => ({ logger: { error: vi.fn() } }));

const dbPost = {
	id: "p1",
	title: "Hello",
	createdAt: new Date("2025-01-01"),
	postTags: [{ tag: { slug: "art" } }],
	mediaAssets: [{ storagePath: "/uploads/a.jpg", width: 100, height: 100 }],
};

describe("getPosts", () => {
	it("should set nextCursor only when rows exceed limit", async () => {
		vi.mocked(getFeedPosts).mockResolvedValue([dbPost, { ...dbPost, id: "p2" }, { ...dbPost, id: "p3" }]);
		vi.mocked(encodeCursor).mockReturnValue("cur");

		const result = await getPosts(undefined, 2);

		expect(result.data).toHaveLength(2);
		expect(result.nextCursor).toBe("cur");
	});

	it("should return null nextCursor when rows fit within limit", async () => {
		vi.mocked(getFeedPosts).mockResolvedValue([dbPost]);

		const result = await getPosts(undefined, 20);

		expect(result.nextCursor).toBeNull();
	});

	it("should map tags and images from DB shape", async () => {
		vi.mocked(getFeedPosts).mockResolvedValue([dbPost]);

		const { data } = await getPosts(undefined, 20);

		expect(data[0].tags).toEqual(["art"]);
		expect(data[0].images).toEqual([{ url: "/uploads/a.jpg", width: 100, height: 100 }]);
	});
});

describe("createPost", () => {
	beforeEach(() => {
		vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("img"));
		vi.mocked(validateImage).mockResolvedValue({ mimeType: "image/jpeg" });
		vi.mocked(normalizeImage).mockResolvedValue({
			buffer: Buffer.from("out"),
			width: 10,
			height: 10,
			mimeType: "image/jpeg",
		});
		vi.mocked(writeFile).mockResolvedValue("/uploads/out.jpg");
		vi.mocked(createPostInDB).mockResolvedValue({ id: "p1", title: "T", createdAt: new Date("2025-01-01") });
	});

	it("should process images and save the post to the database", async () => {
		const result = await createPost({ title: "My Post", tags: ["art"], tmpFilePaths: ["/tmp/a.jpg"] });

		expect(createPostInDB).toHaveBeenCalledWith({
			title: "My Post",
			tags: ["art"],
			images: [{ filePublicPath: "/uploads/out.jpg", mimeType: "image/jpeg", width: 10, height: 10 }],
		});
		expect(result).toEqual({
			id: "p1",
			title: "T",
			createdAt: new Date("2025-01-01"),
			tags: ["art"],
			images: [{ url: "/uploads/out.jpg", width: 10, height: 10 }],
		});
	});

	it("should clean up temp files even when processing fails", async () => {
		vi.mocked(validateImage).mockRejectedValue(new Error("some error"));

		await expect(createPost({ title: "T", tags: [], tmpFilePaths: ["/tmp/a"] })).rejects.toThrow("some error");
		expect(deleteTempFile).toHaveBeenCalledWith("/tmp/a");
	});

	it("should deduplicate tags", async () => {
		await createPost({ title: "T", tags: ["a", "a", "b"], tmpFilePaths: ["/tmp/x"] });

		expect(createPostInDB).toHaveBeenCalledWith(expect.objectContaining({ tags: ["a", "b"] }));
	});
});
