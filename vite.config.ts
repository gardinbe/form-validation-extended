import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const path = (path: string) => resolve(__dirname, path);

export default defineConfig({
	plugins: [
		dts({
			tsconfigPath: path("tsconfig.build.json"),
			rollupTypes: true
		})
	],
	build: {
		outDir: path("dist"),
		lib: {
			formats: ["es", "cjs", "umd"],
			entry: path("src/html-form-validator.ts"),
			name: "html-form-validator",
			fileName: "index"
		},
		rollupOptions: {
			external: ["lodash"],
			output: {
				globals: {
					lodash: "lodash"
				}
			}
		}
	}
});