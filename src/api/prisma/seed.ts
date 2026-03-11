import { createPrismaClient } from "../infra/db/client";

const prisma = createPrismaClient();

const SEED_TAGS = ["nature", "city", "food", "travel", "art", "pets"];

async function main() {
	console.log("Seeding database...");

	for (const slug of SEED_TAGS) {
		await prisma.tag.upsert({
			where: { slug },
			update: {},
			create: { slug, displayName: slug.charAt(0).toUpperCase() + slug.slice(1) },
		});
	}

	console.log(`Seeded ${SEED_TAGS.length} tags.`);
}

main()
	.catch((e) => {
		console.error("Seed failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
