import { io, type Socket } from "socket.io-client";
import { env } from "../lib/env";

let socket: Socket | null = null;

export function getSocket(): Socket {
	if (!socket) {
		socket = io(env.VITE_SOCKET_URL, {
			path: env.VITE_SOCKET_PATH,
			transports: ["websocket", "polling"],
		});
	}
	return socket;
}
