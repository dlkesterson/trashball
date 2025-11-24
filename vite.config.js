import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    base: '/trashball/',
    plugins: [react(), tailwindcss()],
    define: {
        __DEV_TOOLS__: JSON.stringify(true),
    },
    server: {
        port: 5173,
    },
});
