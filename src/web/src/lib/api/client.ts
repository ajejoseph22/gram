import axios from "axios";
import { env } from "../env.ts";

export const client = axios.create({
	baseURL: env.VITE_API_BASE_URL,
});

client.interceptors.response.use(
	(response) => response,
	(error) => {
		const serverMessage = error.response?.data?.error?.message;
		if (serverMessage) {
			return Promise.reject(new Error(serverMessage));
		}
		return Promise.reject(error);
	},
);
