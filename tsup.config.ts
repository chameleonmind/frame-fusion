import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs', 'iife'],
	dts: true,
	outDir: 'dist',
	clean: true,
	minify: true,
})
