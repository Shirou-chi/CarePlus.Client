import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    server: {
        port: 5174,
        strictPort: true,
        proxy: {
            "/api": {
                target: "https://localhost:7231",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});