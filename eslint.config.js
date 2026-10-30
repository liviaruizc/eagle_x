import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs,jsx}"] },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    pluginReact.configs.flat.recommended,
    pluginReactHooks.configs.flat.recommended,
    pluginReactRefresh.configs.vite,
    pluginPrettier,
    {
        rules: {
            // React is a global variable, for now
            "react/react-in-jsx-scope": "off",
            // Some data fields/props are loaded later?
            "react/prop-types": "off",
        },
    },
    {
        ignores: [
            // Vite builds and minifies all Javascript into a single .js file,
            // spawning too many errors.
            "dist/",
        ],
    },
];
