import request from "supertest";
import { expect } from "vitest";

vi.mock("@api/modules/post/post.service", () => ({
	getPosts: vi.fn(),
	createPost: vi.fn(),
}));

const { app } = await import("src/api/server/app");
const { getPosts, createPost } = await import("@api/modules/post/post.service");

const TINY_JPEG = Buffer.from(
	"/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsMDRAZGA0bDRQhEiExGh0fHx8MJygnICIuJCQe/2wBDAQDBAQFBAUJBQUJHhYOFh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAJ/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAFMP//EABQQAQAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
	"base64",
);

describe("POST /post", () => {
	beforeEach(() => {
		vi.mocked(createPost).mockResolvedValue({
			id: "p1",
			title: "T",
			createdAt: new Date("2025-01-01"),
			tags: [],
			images: [],
		});
	});

	it("should return 201 with valid image + title", async () => {
		const res = await request(app).post("/post").field("title", "Hello").attach("images", TINY_JPEG, "img.jpg");

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("id");
	});

	it("should return 400 when no images attached", async () => {
		const res = await request(app).post("/post").field("title", "Hello");

		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("MISSING_IMAGE");
		expect(res.body.error.message).toBe("At least one image is required");
	});

	it("should return 400 when title is missing", async () => {
		const res = await request(app).post("/post").attach("images", TINY_JPEG, "img.jpg");

		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("INVALID_INPUT");
	});

	it("should return 400 when image exceeds size limit", async () => {
		const oversized = Buffer.alloc(11 * 1024 * 1024); // 11MB, limit is 10MB
		const res = await request(app).post("/post").field("title", "Hello").attach("images", oversized, "big.jpg");

		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("UPLOAD_ERROR");
	});

	it("should return 400 when more than 5 images attached", async () => {
		const req = request(app).post("/post").field("title", "Hello");
		for (let i = 0; i < 6; i++) {
			req.attach("images", TINY_JPEG, `img${i}.jpg`);
		}
		const res = await req;

		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("UPLOAD_ERROR");
	});
});

describe("GET /post", () => {
	beforeEach(() => {
		vi.mocked(getPosts).mockResolvedValue({ data: [], nextCursor: null });
	});

	it("should return 200 with { data, nextCursor }", async () => {
		const res = await request(app).get("/post");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("data");
		expect(res.body).toHaveProperty("nextCursor");
	});

	it("should return 400 for invalid limit", async () => {
		const res = await request(app).get("/post?limit=999");

		expect(res.status).toBe(400);
	});

	it("should pass parsed query params to service", async () => {
		await request(app).get("/post?limit=5&tags=nature,art");

		expect(getPosts).toHaveBeenCalledWith(undefined, 5, ["nature", "art"]);
	});
});
