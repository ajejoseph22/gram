import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../infra/config/env.config";
import { createPrismaClient } from "../infra/db/client";

const prisma = createPrismaClient();

const SEED_TAGS = ["nature", "city", "food", "travel", "art", "pets"];

const POST_TITLES = [
	"Golden hour vibes",
	"Just found this gem",
	"Can't believe this is real",
	"Morning light",
	"Weekend adventures",
	"Hidden spot downtown",
	"Fresh out of the oven",
	"Street art around the corner",
	"My little buddy",
	"Sunset from the rooftop",
	"Rain or shine",
	"Late night cooking",
	"The view from up here",
	"Park life",
	"Throwback to last summer",
	"First attempt at plating",
	"Exploring new trails",
	"Urban jungle",
	"Cozy corner",
	"Midnight snack goals",
	"Cloudy with a chance of beauty",
	"Best hiking trail yet",
	"Local market finds",
	"Mural hunting",
	"Lazy Sunday",
	"Homemade pasta day",
	"Skyline at dusk",
	"Wildflowers everywhere",
	"Alley cats",
	"Brunch done right",
	"Foggy morning walk",
	"Rooftop garden",
	"Color explosion",
	"Tiny details matter",
	"After the rain",
	"New recipe who dis",
	"Old town charm",
	"Paws and relax",
	"Bridge at dawn",
	"Farmers market haul",
	"Graffiti lane",
	"Puppy eyes",
	"Ocean breeze",
	"Neon nights",
	"Trail mix and good views",
	"Baking experiments",
	"Window seat",
	"Concrete and sky",
	"Cottage garden",
	"Street food heaven",
];

const COLORS = [
	{ r: 200, g: 120, b: 80 },
	{ r: 80, g: 160, b: 200 },
	{ r: 120, g: 180, b: 100 },
	{ r: 180, g: 100, b: 160 },
	{ r: 220, g: 180, b: 80 },
	{ r: 100, g: 130, b: 180 },
	{ r: 180, g: 140, b: 100 },
	{ r: 140, g: 200, b: 180 },
	{ r: 200, g: 100, b: 100 },
	{ r: 160, g: 160, b: 200 },
];

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

async function generateImage(uploadDir: string): Promise<{ filename: string; width: number; height: number }> {
	const width = randInt(400, 800);
	const height = randInt(400, 800);
	const color = COLORS[randInt(0, COLORS.length - 1)];
	const filename = `${crypto.randomUUID()}.png`;
	const filepath = path.join(uploadDir, filename);

	await sharp({
		create: {
			width,
			height,
			channels: 3,
			background: color,
		},
	})
		.png()
		.toFile(filepath);

	return { filename, width, height };
}

async function main() {
	console.log("Seeding database...");

	// Seed tags
	const seededTags: { id: number; slug: string }[] = [];
	for (const slug of SEED_TAGS) {
		const tag = await prisma.tag.upsert({
			where: { slug },
			update: {},
			create: { slug },
		});
		seededTags.push(tag);
	}
	console.log(`Seeded ${seededTags.length} tags.`);

	// Prepare uploads directory
	const uploadDir = env.UPLOAD_DIR_ABSOLUTE;
	await fs.mkdir(uploadDir, { recursive: true });

	// Seed posts
	const POST_COUNT = 50;
	const baseTime = Date.now();

	for (let i = 0; i < POST_COUNT; i++) {
		const title = POST_TITLES[i % POST_TITLES.length];
		const titleNormalized = title.toLowerCase();
		const createdAt = new Date(baseTime - (POST_COUNT - i) * 60_000); // 1 min apart

		const imageCount = randInt(1, 3);
		const tagCount = randInt(1, 3);
		const postTags = pickRandom(seededTags, tagCount);

		// Generate images
		const images: { filename: string; width: number; height: number }[] = [];
		for (let j = 0; j < imageCount; j++) {
			images.push(await generateImage(uploadDir));
		}

		// Create post with tags and media assets in a transaction
		await prisma.$transaction(async (tx) => {
			const post = await tx.post.create({
				data: {
					title,
					titleNormalized,
					createdAt,
					postTags: {
						create: postTags.map((tag) => ({
							tag: { connect: { id: tag.id } },
						})),
					},
					mediaAssets: {
						create: images.map((img, position) => ({
							position,
							storagePath: path.posix.join(env.UPLOAD_PUBLIC_PATH, img.filename),
							mimeType: "image/png",
							width: img.width,
							height: img.height,
						})),
					},
				},
			});

			return post;
		});

		if ((i + 1) % 10 === 0) {
			console.log(`  Created ${i + 1}/${POST_COUNT} posts...`);
		}
	}

	console.log(`Seeded ${POST_COUNT} posts with images.`);
}

main()
	.catch((e) => {
		console.error("Seed failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
