import pino from "pino";
import { env } from "src/api/infra/config/env.config";

const prettyTransport = (): pino.TransportSingleOptions => ({
	target: "pino-pretty",
	options: {
		colorize: true,
		translateTime: "SYS:standard",
		ignore: "pid,hostname",
	},
});

export const logger = pino({
	level: env.isProduction ? "info" : "debug",
	transport: env.isProduction ? undefined : prettyTransport(),
});
