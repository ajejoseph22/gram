import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";
import { env } from "../config/env.config";

const { PrismaClient } = prismaClientPackage;

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
