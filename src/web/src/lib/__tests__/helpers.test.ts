import { describe, expect, it, vi } from "vitest";
import { formatPostTime } from "../helpers.ts";

describe("formatPostTime", () => {
	it('should return "just now" for < 1 minute ago', () => {
		const now = new Date().toISOString();
		expect(formatPostTime(now)).toBe("just now");
	});

	it('should return "Xm ago" for minutes', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-01T00:05:00Z"));
		expect(formatPostTime("2025-01-01T00:00:00Z")).toBe("5m ago");
		vi.useRealTimers();
	});

	it('should return "Xh ago" for hours', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-01T03:00:00Z"));
		expect(formatPostTime("2025-01-01T00:00:00Z")).toBe("3h ago");
		vi.useRealTimers();
	});

	it('should return "Xd ago" for days', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-03T00:00:00Z"));
		expect(formatPostTime("2025-01-01T00:00:00Z")).toBe("2d ago");
		vi.useRealTimers();
	});
});
