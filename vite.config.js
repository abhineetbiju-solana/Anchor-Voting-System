import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    root: './app',
    plugins: [nodePolyfills()],
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: '../dist',
    },
});