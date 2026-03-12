import { ImageValidationError } from "@api/modules/post/utils/images/image-validator";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createPost as createPostServiceFn } from "./post.service";
import type { PostBody } from "./validators/post.schema";

export async function createPost(req: Request, res: Response) {
	try {
		const { title, tags } = req.body as PostBody;
		const files = req.files as Express.Multer.File[];

		const result = await createPostServiceFn({ title, tags, tmpFilePaths: files.map((f) => f.path) });

		res.status(StatusCodes.CREATED).json({ data: result });
	} catch (err) {
		if (err instanceof ImageValidationError) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: { code: "INVALID_UPLOAD", message: err.message } });
			return;
		}
		throw err;
	}
}
