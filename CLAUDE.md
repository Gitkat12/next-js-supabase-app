# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 15 + Supabase 스타터 키트입니다. Supabase를 사용한 사용자 인증, Tailwind CSS 스타일링, shadcn/ui 컴포넌트가 포함되어 있습니다.

## 주요 스택

- **프론트엔드**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **인증**: Supabase Auth (SSR 방식, 쿠키 기반 세션)
- **테마**: next-themes (라이트/다크 모드)
- **아이콘**: lucide-react

## 커맨드

```bash
npm run dev        # 개발 서버 시작 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run start      # 빌드된 앱 시작
npm run lint       # ESLint 실행
```

## 프로젝트 구조

### `/app`
Next.js App Router 디렉토리. 주요 구조:
- `layout.tsx` - 루트 레이아웃 (ThemeProvider, 글로벌 CSS 포함)
- `page.tsx` - 홈페이지
- `/auth/*` - 인증 페이지들 (로그인, 회원가입, 비밀번호 재설정 등)
- `/protected/*` - 로그인 필수 페이지들

### `/components`
React 컴포넌트들:
- `/ui` - shadcn/ui 컴포넌트 (Button, Card, Input, Label 등)
- 인증 폼 컴포넌트 (`login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx` 등)
- 기타 컴포넌트 (`auth-button.tsx`, `theme-switcher.tsx` 등)

### `/lib`
유틸리티 및 설정:
- `/supabase/client.ts` - 클라이언트 사이드 Supabase 클라이언트 (브라우저 환경용)
- `/supabase/server.ts` - 서버 사이드 Supabase 클라이언트 (Server Components/Actions용)
- `/supabase/proxy.ts` - API 라우트용 프록시 클라이언트
- `utils.ts` - 유틸리티 함수들

## Supabase 인증 시스템 이해하기

이 프로젝트는 **쿠키 기반 세션 관리**를 사용합니다 (supabase-ssr 패키지).

### 클라이언트 vs 서버 클라이언트 분리

1. **클라이언트 컴포넌트에서**: `lib/supabase/client.ts`의 `createClient()` 사용
   - Client Component에서만 사용
   - 브라우저 환경에서만 동작

2. **서버 컴포넌트/액션에서**: `lib/supabase/server.ts`의 `createClient()` 사용
   - Server Component, Server Action, Route Handler에서 사용
   - 쿠키를 자동으로 관리
   - **중요**: 함수 내에서 매번 새로운 클라이언트를 생성해야 함 (Fluid compute 사용 시)

3. **API 라우트에서**: `lib/supabase/proxy.ts` 사용 (필요시)

### 인증 흐름

- 사용자 로그인 → 세션 쿠키 저장 → 다른 페이지에서 쿠키로 세션 유지
- `/app/auth/*` 페이지에서 가입/로그인 처리
- `/app/protected/*`는 인증된 사용자만 접근 가능 (서버에서 인증 확인)

## 환경 설정

### 필수 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

- 이 값들은 Supabase 대시보드의 "Project Settings > API"에서 찾을 수 있습니다
- `NEXT_PUBLIC_*` 접두사는 브라우저에 노출되어도 안전한 공개 키입니다

## 주요 패턴

### 서버 컴포넌트에서 사용자 확인

```typescript
// app/protected/page.tsx 패턴
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 인증 확인 로직
  }

  return <div>...</div>;
}
```

### 클라이언트 컴포넌트에서 인증

```typescript
// 'use client';
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  return <button>{user ? "Logout" : "Login"}</button>;
}
```

## shadcn/ui 컴포넌트 추가

shadcn/ui 컴포넌트를 추가하려면:

```bash
npx shadcn-ui@latest add <component-name>
```

예: `npx shadcn-ui@latest add dialog`

- 컴포넌트는 `/components/ui/`에 생성됩니다
- `components.json`에 설정된 경로를 따릅니다 (Tailwind CSS 설정 포함)

## 배포

### Vercel 배포

1. GitHub에 푸시
2. Vercel에서 프로젝트 임포트
3. 환경 변수 설정 (위의 필수 환경 변수 참고)
4. Supabase Vercel Integration 연결 (자동으로 환경 변수 주입)

### 로컬 Supabase 개발

Supabase CLI를 사용하여 로컬 개발:

```bash
npx supabase start
```

상세 가이드: https://supabase.com/docs/guides/getting-started/local-development

## 라우팅 규칙

- `app/page.tsx` - 공개 홈페이지
- `app/auth/*` - 인증 관련 페이지 (공개)
- `app/protected/*` - 인증 필수 페이지 (서버에서 확인)

## 코딩 스타일

- 2칸 들여쓰기
- TypeScript 필수
- 클라이언트/서버 분리 명확히 ('use client' 지시문 사용)
- 한국어 주석/커밋 메시지

## 자주 하는 작업

### 새 페이지 추가

```typescript
// app/some-page/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function SomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>...</div>;
}
```

### 새 폼 컴포넌트 추가

```typescript
// 'use client';
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function MyForm() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // 로직...
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 데이터베이스 쿼리

```typescript
// Server Component/Action에서
const supabase = await createClient();
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId);
```

## 주의사항

- Supabase 서버 클라이언트는 **함수 내에서 매번 새로 생성**해야 합니다
- 클라이언트 컴포넌트와 서버 컴포넌트 간 경계를 명확히 하세요
- `.env.local`은 git에 커밋하지 않습니다
- NEXT_PUBLIC_* 변수는 브라우저에 노출되므로 민감한 정보를 담지 않습니다
