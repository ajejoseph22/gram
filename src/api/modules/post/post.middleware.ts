import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { env } from "src/api/infra/config/env.config";
import { postBodySchema } from "./validators/post.schema";

export const parseUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
}).array("images", env.MAX_UPLOAD_NUMBER);

export function validatePost(req: Request, res: Response, next: NextFunction) {
	if (!req.files || !(req.files as Express.Multer.File[]).length) {
		res.status(StatusCodes.BAD_REQUEST).json({ error: { code: "MISSING_IMAGE", message: "At least one image is required" } });
		return;
	}

	const parsed = postBodySchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(StatusCodes.BAD_REQUEST).json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
		return;
	}

	req.body = parsed.data;
	next();
}