import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			formats: ["es", "cjs", "umd"],
			entry: resolve(__dirname, "src/form-validator.ts"),
			name: "html-form-validator"
		},
		rollupOptions: {
			external: ["vue"]
		}
	}
});