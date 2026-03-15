import { useEffect } from "react";
import type { Post } from "../lib/post.api";
import { SocketEvent } from "./events.ts";
import { getSocket } from "./socket";

export function useFeedSocket(onNewPost: (post: Post) => void) {
	useEffect(() => {
		const socket = getSocket();

		socket.on(SocketEvent.POST_CREATED, onNewPost);

		return () => {
			socket.off(SocketEvent.POST_CREATED, onNewPost);
		};
	}, [onNewPost]);
}
