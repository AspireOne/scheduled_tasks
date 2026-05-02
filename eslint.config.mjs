import eslintJs from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const typeScriptFiles = ["src/**/*.ts", "*.config.ts"];

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },

  {
    files: typeScriptFiles,
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
