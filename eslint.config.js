import globals from "globals";
import pluginJs from "@eslint/js";
import jest from "eslint-plugin-jest";
import importPlugin from "eslint-plugin-import";

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.test.js"],
    plugins: {
      jest: jest,
    },
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  {
    files: ["**/*.js"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/extensions": ["error", "always"],
    },
  },
];
