import type { ConfigArray } from "typescript-eslint";

import eslint from "@eslint/js";
import astroPlugin from "eslint-plugin-astro";
import perfectionist from "eslint-plugin-perfectionist";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export function getConfig(
	customConfig?: ConfigArray,
	options?: {
		customGlobals?: Record<string, "readonly" | "writeable">;
		withAstro?: boolean;
	},
) {
	const customGlobals = options?.customGlobals ?? {};
	const withAstro = options?.withAstro ?? false;

	const baseConfig = [
		eslint.configs.recommended,
		...tseslint.configs.strictTypeChecked,
		...tseslint.configs.stylisticTypeChecked,
		{
			languageOptions: {
				globals: {
					...globals.builtin,
					...globals.nodeBuiltin,
					...customGlobals,
				},
				parser: tseslint.parser,
				parserOptions: {
					// projectService: true, // Astro ecosystem tools can't use this yet; 2024Q4
					project: ["./tsconfig.json"],
				},
			},
			plugins: {
				"@typescript-eslint": tseslint.plugin,
			},
			rules: {
				"@typescript-eslint/array-type": ["warn", { default: "generic" }],
				"@typescript-eslint/no-non-null-assertion": "off",
				"@typescript-eslint/no-unused-vars": [
					"error",
					{
						argsIgnorePattern: "^_",
						caughtErrorsIgnorePattern: "^_",
						destructuredArrayIgnorePattern: "^_",
						ignoreRestSiblings: true,
						varsIgnorePattern: "^_",
					},
				],
				"@typescript-eslint/prefer-nullish-coalescing": "off",
			},
		},
		unicornPlugin.configs["flat/recommended"],
		{
			rules: {
				"unicorn/filename-case": "warn",
				"unicorn/no-array-callback-reference": "off", // I prefer this pattern for filtering/sorting content
				"unicorn/prevent-abbreviations": "off", // I *like* abbreviations!
			},
		},
		{
			plugins: {
				perfectionist,
			},
			rules: {
				...perfectionist.configs["recommended-natural"].rules,
				"sort-classes": "off",
				"perfectionist/sort-imports": [
					"error",
					{
						type: "natural",
						internalPattern: ["^~/.*", "^@/.*", "^#.*"],
					},
				],
				"perfectionist/sort-interfaces": "off",
				"perfectionist/sort-jsx-props": "off",
				"perfectionist/sort-maps": "off",
				"perfectionist/sort-modules": "off",
				"perfectionist/sort-objects": "off",
				"perfectionist/sort-object-types": "off",
				"perfectionist/sort-sets": "off",
				"perfectionist/sort-switch-case": "off",
				"perfectionist/sort-union-types": "off",
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
				"@typescript-eslint/no-unsafe-argument": "off",
				"@typescript-eslint/no-unsafe-assignment": "off",
				"@typescript-eslint/no-unsafe-call": "off",
				"@typescript-eslint/no-unsafe-member-access": "off",
				"@typescript-eslint/no-unsafe-return": "off",
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
