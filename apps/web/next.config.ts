import type { NextConfig } from "next";

const config: NextConfig = {
  // Paket bersama ditulis dalam TypeScript sumber (main: src/index.ts).
  transpilePackages: ["@draught-survey/survey-engine", "@draught-survey/scenario-schema"],
};

export default config;
