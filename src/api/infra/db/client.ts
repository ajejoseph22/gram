import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.config";

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});

	return new PrismaClient({
		adapter,
		log: env.isDevelopment ? ["query", "warn", "error"] : ["warn", "error"],
	});
}

export const prisma = createPrismaClient();
