import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    files: ["server/**/*.js"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
];
