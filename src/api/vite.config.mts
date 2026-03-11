import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			provider: "istanbul",
			exclude: ["**/node_modules/**", "**/index.ts", "vite.config.mts", "**/dist/**"],
		},
		globals: true,
		restoreMocks: true,
	},
	plugins: [tsconfigPaths()],
});
