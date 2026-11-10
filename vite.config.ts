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
        // Keep React and ReactDOM on one physical module instance. Without
        // this, Vite can prebundle React twice (especially on Windows when
        // path casing differs), which causes the Invalid hook call crash.
        dedupe: ["react", "react-dom"],
    },
    server: {
        port: 5174,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://localhost:5156",
                changeOrigin: true,
            },
        },
    },
});
