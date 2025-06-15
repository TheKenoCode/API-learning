module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  ignorePatterns: ["node_modules/", ".next/", "dist/"],
  overrides: [
    {
      files: ["packages/web/**/*.{js,jsx,ts,tsx}"],
      extends: ["next/core-web-vitals"],
      settings: {
        react: {
          version: "detect",
        },
        next: {
          rootDir: "packages/web/",
        },
      },
    },
  ],
};
