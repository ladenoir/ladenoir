import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Importing `motion` pulls the full feature bundle and defeats
      // LazyMotion. Use `* as m from "motion/react-m"` instead.
      // AnimatePresence / LazyMotion / hooks stay importable from motion/react.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "motion/react",
              importNames: ["motion"],
              message:
                'Import `* as m from "motion/react-m"` instead — `motion` defeats LazyMotion and doubles the bundle.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
