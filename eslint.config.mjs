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
      // TypeScript rules - enforce proper typing
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // React rules
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "error",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",

      // Next.js rules
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

      // General JavaScript/TypeScript rules - enforce consistency
      "prefer-const": "error",
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-console": "warn",
      "no-debugger": "error",
      "no-empty": "error",
      "no-irregular-whitespace": "error",
      "no-case-declarations": "error",
      "no-fallthrough": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-redeclare": "error",
      "no-undef": "off", // TypeScript handles this
      "no-unreachable": "error",
      "no-useless-escape": "error",

      // Code style rules
      "quotes": ["error", "single", { "avoidEscape": true }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "space-before-blocks": "error",
      "space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
      }],
      "space-infix-ops": "error",
      "eol-last": "error",
      "no-trailing-spaces": "error",
      "max-len": ["warn", {
        "code": 120,
        "ignoreComments": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true
      }],

      // Import/Export rules
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"]
      }],

      // Best practices
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "dot-notation": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "template-curly-spacing": "error",

      // Error prevention
      "no-async-promise-executor": "error",
      "no-await-in-loop": "warn",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-constant-condition": "warn",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-extra-semi": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-implicit-globals": "error",
      "no-iterator": "error",
      "no-loop-func": "error",
      "no-mixed-operators": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-regex-spaces": "error",
      "no-return-assign": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-void": "error",
      "no-with": "error",
      "radix": "error",
      "wrap-iife": ["error", "inside"],
      "yoda": "error"
    },
  },
];

export default eslintConfig;
