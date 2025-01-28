import eslint from "@eslint/js";
import astroPlugin from "eslint-plugin-astro";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

import type { ConfigArray } from "typescript-eslint";

export function getConfig(
  customConfig?: ConfigArray,
  options?: {
    customGlobals?: Record<string, "readonly" | "writeable">;
    withAstro?: boolean;
  }
) {
  const customGlobals = options?.customGlobals ?? {};
  const withAstro = options?.withAstro ?? false;

  const baseConfig = [
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          // projectService: true, // Astro ecosystem tools can't use this yet; 2024Q4
          project: ["./tsconfig.json"],
        },
        globals: {
          ...globals.builtin,
          ...globals.nodeBuiltin,
          ...customGlobals,
        },
      },
      plugins: {
        "@typescript-eslint": tseslint.plugin,
      },
      rules: {
        "@typescript-eslint/array-type": ["warn", { default: "generic" }],
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },

    /**
     * Simple import sort
     */
    {
      plugins: {
        "simple-import-sort": simpleImportSortPlugin,
      },
      rules: {
        "simple-import-sort/imports": [
          "warn",
          {
            groups: [
              [String.raw`^@?\w`], // External packages
              [String.raw`^.*\u0000$`], // Type imports
              ["^(@/)(/.*|$)"], // Internal imports prefixed with `@/`
              [String.raw`^\u0000`], // Side effect imports
              [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`], // Parent imports; put `..` last
              [
                String.raw`^\./(?=.*/)(?!/?$)`,
                String.raw`^\.(?!/?$)`,
                String.raw`^\./?$`,
              ], // Other relative imports; put same folder imports and `.` last
              [String.raw`^.+\.s?css$`], // Style imports
            ],
          },
        ],
        "simple-import-sort/exports": "warn",
      },
    },

    /**
     * Unicorn
     */
    unicornPlugin.configs["flat/recommended"],
    {
      rules: {
        "unicorn/filename-case": "warn",
        "unicorn/no-array-callback-reference": "off", // I prefer this pattern for filtering/sorting content
        "unicorn/prevent-abbreviations": "off", // I *like* abbreviations!
      },
    },
  ] satisfies ConfigArray;

  /**
   * Astro support; with some help from...
   * @reference - https://github.com/Princesseuh/erika.florist/blob/main/eslint.config.js
   */
  const astroConfig = [
    ...astroPlugin.configs.recommended,
    ...astroPlugin.configs["jsx-a11y-strict"],

    // Remove some safety rules around `any` for various reasons
    // Astro.props isn't typed correctly in some contexts, so a bunch of things ends up being `any`
    {
      files: ["**/*.astro"],
      rules: {
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
      },
    },

    // Disable typed rules for scripts inside Astro files
    // https://github.com/ota-meshi/eslint-plugin-astro/issues/240
    {
      files: ["**/*.astro/*.ts"],
      languageOptions: {
        parserOptions: {
          // eslint-disable-next-line unicorn/no-null
          project: null,
        },
      },
      ...tseslint.configs.disableTypeChecked,
    },
  ] satisfies ConfigArray;

  return tseslint.config([
    ...baseConfig,
    ...(withAstro ? astroConfig : []),
    ...(customConfig ?? []),
  ]);
}
