import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve(import.meta.dirname, './src/lib'),
			'$app/environment': path.resolve(import.meta.dirname, './tests/mocks/app-environment.ts')
		}
	},
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
