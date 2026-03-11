import {parseApiEnv} from "../env.config";

describe("parseApiEnv", () => {
	it("should apply sensible defaults for local development", () => {
		const parsed = parseApiEnv({
			CORS_ORIGIN: "http://localhost:3000",
			DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/gram",
		});

		expect(parsed.NODE_ENV).toBe("development");
		expect(parsed.HOST).toBe("localhost");
		expect(parsed.PORT).toBe(8080);
		expect(parsed.SOCKET_PATH).toBe("/socket.io");
		expect(parsed.MAX_UPLOAD_SIZE_MB).toBe(10);
	});

	it("should reject non-postgres database urls", () => {
		expect(() =>
			parseApiEnv({
				CORS_ORIGIN: "http://localhost:3000",
				DATABASE_URL: "mysql://localhost:3306/gram",
			}),
		).toThrow("Invalid environment variables");
	});

	it("should normalize socket paths with a leading slash", () => {
		const parsed = parseApiEnv({
			CORS_ORIGIN: "http://localhost:3000",
			DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/gram",
			SOCKET_PATH: "ws",
		});

		expect(parsed.SOCKET_PATH).toBe("/ws");
	});
});
