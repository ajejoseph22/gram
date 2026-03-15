import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { deleteTempFile } from "@api/modules/post/utils/images/storage-adapter";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { env } from "src/api/infra/config/env.config";
import { createPostBodySchema, getPostsQuerySchema } from "./validators/post.schema";

mkdirSync(env.UPLOAD_TMP_DIR_ABSOLUTE, { recursive: true });

async function cleanupTemporaryFiles(files?: Express.Multer.File[]) {
	await Promise.allSettled((files || []).map(async (file) => deleteTempFile(file.path)));
}

const uploadHandler = multer({
	storage: multer.diskStorage({
		destination: env.UPLOAD_TMP_DIR_ABSOLUTE,
		filename: (_req, _file, cb) => cb(null, randomUUID()),
	}),
	limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
}).array("images", env.MAX_UPLOAD_NUMBER);

export function validateCreatePostRequest(req: Request, res: Response, next: NextFunction) {
	uploadHandler(req, res, (err) => {
		// Validate the file upload first
		if (err) {
			void cleanupTemporaryFiles(req.files as Express.Multer.File[] | undefined);

			if (err instanceof multer.MulterError) {
				res.status(StatusCodes.BAD_REQUEST).json({
					error: { code: "UPLOAD_ERROR", message: `Upload error: ${err.message}` },
				});
				return;
			}

			// For unexpected errors, we pass them to the global error handler
			next(err);
			return;
		}

		const files = req.files as Express.Multer.File[] | undefined;

		if (!files?.length) {
			res
				.status(StatusCodes.BAD_REQUEST)
				.json({ error: { code: "MISSING_IMAGE", message: "At least one image is required" } });
			return;
		}

		// Validate the rest of the body using Zod
		const parsed = createPostBodySchema.safeParse(req.body);
		if (!parsed.success) {
			void cleanupTemporaryFiles(files);
			res
				.status(StatusCodes.BAD_REQUEST)
				.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
			return;
		}

		req.body = parsed.data;
		next();
	});
}

export function validateGetPostsRequest(req: Request, res: Response, next: NextFunction) {
	const parsed = getPostsQuerySchema.safeParse(req.query);

	if (!parsed.success) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ error: { code: "INVALID_QUERY", message: parsed.error.issues[0].message } });
		return;
	}

	res.locals.getPostsQuery = parsed.data;
	next();
}
