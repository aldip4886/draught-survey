import { defineConfig, mergeConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import base from "./vite.config";

// `npm run dev:https`: sertifikat self-signed. WebXR di Quest butuh konteks aman, dan peramban
// Quest mengizinkan lanjut setelah peringatan sertifikat.
export default mergeConfig(base, defineConfig({ plugins: [basicSsl()] }));
