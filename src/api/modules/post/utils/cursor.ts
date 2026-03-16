import type { FeedCursor } from "@api/modules/post/post.repository";

const CURSOR_SEPARATOR = "_";

export function encodeCursor(createdAt: Date, id: string): string {
	return Buffer.from(`${createdAt.toISOString()}${CURSOR_SEPARATOR}${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): FeedCursor {
	const decoded = Buffer.from(cursor, "base64url").toString();
	const separatorIndex = decoded.indexOf(CURSOR_SEPARATOR);
	if (separatorIndex === -1) throw new Error("Invalid cursor");

	const createdAt = new Date(decoded.slice(0, separatorIndex));
	const id = decoded.slice(separatorIndex + 1);

	if (Number.isNaN(createdAt.getTime()) || !id) throw new Error("Invalid cursor");

	return { createdAt, id };
}
