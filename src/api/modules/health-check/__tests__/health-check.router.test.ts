import { StatusCodes } from "http-status-codes";
import { app } from "src/api/server/app";
import request from "supertest";

describe("Health Check API endpoints", () => {
	it("should return a healthy status on GET /", async () => {
		const response = await request(app).get("/health-check");
		const result = response.body;

		expect(response.statusCode).toEqual(StatusCodes.OK);
		expect(result.message).toEqual("Service is healthy");
	});
});
