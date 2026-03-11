import { StatusCodes } from "http-status-codes";
import { app } from "src/api/server/app";
import request from "supertest";

import { generateOpenAPIDocument } from "../open-api.document-generator";

describe("OpenAPI Router", () => {
	describe("Swagger JSON route", () => {
		it("should return Swagger JSON content", async () => {
			const expectedResponse = generateOpenAPIDocument();

			const response = await request(app).get("/swagger.json");

			expect(response.status).toBe(StatusCodes.OK);
			expect(response.type).toBe("application/json");
			expect(response.body).toEqual(expectedResponse);
		});

		it("should serve the Swagger UI", async () => {
			const response = await request(app).get("/");

			expect(response.status).toBe(StatusCodes.OK);
			expect(response.text).toContain("swagger-ui");
		});
	});
});
