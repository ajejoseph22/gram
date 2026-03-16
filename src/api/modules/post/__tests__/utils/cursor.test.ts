import { decodeCursor, encodeCursor } from "../../utils/cursor";

describe("cursor utils", () => {
	const date = new Date("2025-06-15T12:00:00.000Z");
	const id = "abc-123-def";

	it("should decode to correct { createdAt, id }", () => {
		const cursor = encodeCursor(date, id);
		const result = decodeCursor(cursor);

		expect(result.createdAt.toISOString()).toBe(date.toISOString());
		expect(result.id).toBe(id);
	});

	it("should throw on malformed input (no separator)", () => {
		const badCursor = Buffer.from("noseparator").toString("base64url");

		expect(() => decodeCursor(badCursor)).toThrow("Invalid cursor");
	});

	it("should throw on invalid date", () => {
		const badCursor = Buffer.from("not-a-date_some-id").toString("base64url");

		expect(() => decodeCursor(badCursor)).toThrow("Invalid cursor");
	});

	it("should throw on missing id", () => {
		const badCursor = Buffer.from(`${date.toISOString()}_`).toString("base64url");

		expect(() => decodeCursor(badCursor)).toThrow("Invalid cursor");
	});
});
