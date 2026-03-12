import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { deleteTempFile } from "@api/modules/post/utils/images/storage-adapter";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { env } from "src/api/infra/config/env.config";
import { postBodySchema } from "./validators/post.schema";

mkdirSync(env.UPLOAD_TMP_DIR_ABSOLUTE, { recursive: true });

async function cleanupTemporaryFiles(files?: Express.Multer.File[]) {
	await Promise.allSettled((files || []).map(async (file) => deleteTempFile(file.path)));
}

const upload = multer({
	storage: multer.diskStorage({
		destination: env.UPLOAD_TMP_DIR_ABSOLUTE,
		filename: (_req, _file, cb) => cb(null, randomUUID()),
	}),
	limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
}).array("images", env.MAX_UPLOAD_NUMBER);

export function parseUpload(req: Request, res: Response, next: NextFunction) {
	upload(req, res, (err) => {
		if (err) {
			if (err instanceof multer.MulterError) {
				cleanupTemporaryFiles(req.files as Express.Multer.File[] | undefined).finally(() => {
					res.status(StatusCodes.BAD_REQUEST).json({
						error: { code: "UPLOAD_ERROR", message: `Upload error: ${err.message}` },
					});
				});
				return;
			}

			cleanupTemporaryFiles(req.files as Express.Multer.File[] | undefined).finally(() => {
				next(err);
			});
			return;
		}

		next();
	});
}

export async function validatePost(req: Request, res: Response, next: NextFunction) {
	const files = req.files as Express.Multer.File[] | undefined;

	if (!files?.length) {
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ error: { code: "MISSING_IMAGE", message: "At least one image is required" } });
		return;
	}

	const parsed = postBodySchema.safeParse(req.body);
	if (!parsed.success) {
		await cleanupTemporaryFiles(files);
		res
			.status(StatusCodes.BAD_REQUEST)
			.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
		return;
	}

	req.body = parsed.data;
	next();
}
