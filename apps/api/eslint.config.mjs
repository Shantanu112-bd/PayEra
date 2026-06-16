import nodeConfig from "../../tools/eslint-config/node.mjs";

export default [
  ...nodeConfig,
  {
    files: ["src/**/*.controller.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
