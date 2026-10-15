import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "src-tauri/target/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.{ts,tsx}"], languageOptions: { globals: globals.browser } },
  { files: ["vite.config.ts"], languageOptions: { globals: globals.node } }
);
