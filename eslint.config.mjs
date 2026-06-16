import baseConfig from "./tools/eslint-config/base.mjs";

const eslintConfig = [
  ...baseConfig,
  {
    ignores: [
      "**/.next/**",
      "**/coverage/**",
      "**/dist/**",
      "node_modules/**",
      "target/**",
      "**/next-env.d.ts",
    ],
  },
];

export default eslintConfig;
