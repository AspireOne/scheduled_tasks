import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts", "src/task/**/*.ts"],
  project: ["src/**/*.ts"],
};

export default config;
