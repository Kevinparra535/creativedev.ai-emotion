import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

// ESLint flat config (type-aware for TS only)
export default tseslint.config(
  // Ignore build artifacts
  { ignores: ["dist", "node_modules", "coverage"] },

  // Base JS rules
  js.configs.recommended,

  // React rules
  react.configs.flat.recommended,

  // TypeScript rules (non type-aware for speed/compat)
  ...tseslint.configs.recommended,

  // Shared project specifics and Prettier compatibility
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.browser } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // New JSX transform means React in scope is not required
      "react/react-in-jsx-scope": "off",
      // Keep as a warning to avoid breaking dev for external links
      "react/jsx-no-target-blank": "warn",
      // Developer ergonomics
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Overrides for R3F scene files: allow three.js JSX props and TS ergonomics
  {
    files: ["src/scene/r3f/**/*.{ts,tsx}"],
    rules: {
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Overrides for new UI R3F files
  {
    files: ["src/ui/scene/**/*.{ts,tsx}", "src/ui/canvas/**/*.{ts,tsx}"],
    rules: {
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Specific utility file uses permissive parsing of external JSON
  {
    files: ["src/utils/iaUtiils.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);
