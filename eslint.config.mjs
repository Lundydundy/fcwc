import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable warnings for unused functions
      '@typescript-eslint/no-unused-vars': 'off',
      // Disable warnings for unexpected any type
      '@typescript-eslint/no-explicit-any': 'off',
      // Disable warnings for missing return type on functions
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;
