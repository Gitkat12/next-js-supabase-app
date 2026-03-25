import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Prettier 충돌 규칙 비활성화 (반드시 마지막에 위치)
  eslintConfigPrettier,

  // 프로젝트 맞춤 규칙
  {
    rules: {
      // 미사용 변수 경고 (언더스코어 접두사 예외)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // console.log 경고 (console.error/warn은 허용)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // React import 불필요 (React 17+ JSX transform)
      "react/react-in-jsx-scope": "off",

      // Next.js Image 컴포넌트 권장 (경고만)
      "@next/next/no-img-element": "warn",

      // 빈 인터페이스 허용
      "@typescript-eslint/no-empty-object-type": "off",

      // any 타입 경고
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
