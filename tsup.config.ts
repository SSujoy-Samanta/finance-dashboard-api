import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/server.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: true,
    splitting: false,
    target: 'node22',

    esbuildOptions(options) {
        // Mark ALL node_modules as external automatically
        // Only source files get bundled
        options.packages = 'external'
        options.alias = { '@': './src' }
    },
})
