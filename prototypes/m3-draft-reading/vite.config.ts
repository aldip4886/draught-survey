import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// `npm run dev:https` memakai sertifikat self-signed: WebXR di Quest butuh konteks aman,
// dan peramban Quest mengizinkan lanjut setelah peringatan sertifikat.
export default defineConfig(({ command, mode }) => ({
  plugins: [react(), ...(process.argv.includes("--https") && command === "serve" && mode !== "test" ? [basicSsl()] : [])],
  resolve: { dedupe: ["three", "react", "react-dom"] },
}));
