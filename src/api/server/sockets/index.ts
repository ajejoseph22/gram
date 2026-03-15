import type { Server as HttpServer } from "node:http";
import { env } from "@api/infra/config/env.config";
import { logger } from "@api/infra/logger/logger";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
	io = new SocketIOServer(httpServer, {
		cors: {
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST"],
		},
		path: env.SOCKET_PATH,
	});

	io.on("connection", (socket) => {
		logger.info({ socketId: socket.id }, "Client connected");

		socket.on("disconnect", (reason) => {
			logger.info({ socketId: socket.id, reason }, "Client disconnected");
		});
	});

	return io;
}

export function getIO(): SocketIOServer {
	if (!io) {
		throw new Error("Socket.IO server not initialized. Call createSocketServer first.");
	}
	return io;
}
