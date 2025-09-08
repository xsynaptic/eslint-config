import type { Config, ConfigWithExtends, ConfigWithExtendsArray } from "@eslint/config-helpers";

import { defineConfig } from "@eslint/config-helpers";
import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export function getConfig(
	customConfig?: ConfigWithExtendsArray,
	options?: {
		customGlobals?: Record<string, "readonly" | "writeable">;
		parserOptions?: NonNullable<Config["languageOptions"]>["parserOptions"];
	},
) {
	const customGlobals = options?.customGlobals ?? {};

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
				parserOptions: options?.parserOptions ?? {
					projectService: true,
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
		unicornPlugin.configs.recommended,
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
	] as Array<ConfigWithExtends>; // Note: this is a workaround for a type incompatibility

	return defineConfig(...baseConfig, ...(customConfig ?? []));
}
