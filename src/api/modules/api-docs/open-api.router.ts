import express, { type Request, type Response, type Router } from "express";
import { generateOpenAPIDocument } from "src/api/modules/api-docs/open-api.document-generator";
import swaggerUi from "swagger-ui-express";

export const openAPIRouter: Router = express.Router();
const openAPIDocument = generateOpenAPIDocument();

openAPIRouter.get("/swagger.json", (_req: Request, res: Response) => {
	res.setHeader("Content-Type", "application/json");
	res.send(openAPIDocument);
});

openAPIRouter.use("/", swaggerUi.serve, swaggerUi.setup(openAPIDocument));
