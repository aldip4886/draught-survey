import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@draught-survey/survey-engine", "@draught-survey/scenario-schema"],
  outputFileTracingRoot: resolve(here, "../.."),
};

export default nextConfig;
