import { createServer } from "node:http";
import { createSocketServer } from "@api/server/sockets";
import { env } from "src/api/infra/config/env.config";
import { prisma } from "src/api/infra/db/client";
import { logger } from "src/api/infra/logger/logger";
import { app } from "src/api/server/app";

async function main() {
	await prisma.$connect();
	logger.info("Database connected");

	const httpServer = createServer(app);
	createSocketServer(httpServer);

	httpServer.listen(env.PORT, () => {
		const { NODE_ENV, HOST, PORT } = env;
		logger.info(`Server (${NODE_ENV}) running on http://${HOST}:${PORT}`);
	});

	const onCloseSignal = async () => {
		logger.info("Shutdown signal received, gracefully shutting down...");
		await prisma.$disconnect();
		httpServer.close(() => {
			logger.info("Server closed");
			process.exit();
		});
		setTimeout(() => process.exit(1), 10000).unref();
	};

	process.on("SIGINT", onCloseSignal);
	process.on("SIGTERM", onCloseSignal);
}

main().catch((err) => {
	logger.error({ err }, "Failed to start server");
	process.exit(1);
});
