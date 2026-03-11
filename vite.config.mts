import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			exclude: ["**/node_modules/**", "**/index.ts", "vite.config.mts", "**/dist/**"],
		},
		globals: true,
		restoreMocks: true,
		include: ["apps/api/src/**/__tests__/**/*.test.ts"],
	},
	plugins: [
		tsconfigPaths({
			projects: ["./apps/api/tsconfig.json"],
		}),
	],
});
