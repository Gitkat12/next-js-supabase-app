# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**모임** — 소규모 모임 이벤트 관리 웹 서비스입니다. 카카오톡에 묻히는 공지/참여 확인을 한 곳에서 관리하여 주최자의 운영 부담을 줄입니다.

- **주최자**: Google 로그인 후 이벤트 생성·관리·공지 등록
- **참여자**: 로그인 없이 공유 링크로 참여 응답

## 주요 스택

- **프론트엔드**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **인증**: Supabase Auth — Google OAuth 전용 (쿠키 기반 SSR 세션)
- **백엔드**: Supabase (PostgreSQL, Realtime)
- **테마**: next-themes (라이트/다크 모드)
- **아이콘**: lucide-react
- **배포**: Vercel

## 커맨드

```bash
npm run dev        # 개발 서버 시작 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run start      # 빌드된 앱 시작
npm run lint       # ESLint 실행
npm run typecheck  # TypeScript 타입 검사
npm run validate   # typecheck + lint + format:check 전체 검사
```

## 프로젝트 구조

```
app/
  layout.tsx              # 루트 레이아웃 (ThemeProvider, 글로벌 CSS)
  page.tsx                # 홈페이지 (서비스 소개 랜딩)
  auth/                   # 인증 페이지 (공개)
  protected/              # 임시 보호 페이지 (스타터킷 잔재)
  events/                 # 이벤트 라우트 (Phase 1~3 구현 예정)
    layout.tsx            # 이벤트 공통 레이아웃
    page.tsx              # 이벤트 목록 (로그인 필수)
    new/page.tsx          # 이벤트 생성 (로그인 필수)
    [id]/page.tsx         # 이벤트 상세 (공개 — share_token 기반)
    [id]/manage/page.tsx  # 이벤트 관리 (로그인 필수 + 본인 이벤트)
components/
  layout/                 # 공통 레이아웃 컴포넌트
    header.tsx            # 서비스 헤더
    footer.tsx            # 서비스 푸터
  ui/                     # shadcn/ui 컴포넌트 (직접 수정 금지)
  events/                 # 이벤트 전용 컴포넌트 (Phase 2 예정)
  auth-button.tsx         # 인증 상태 버튼 (Server Component)
  logout-button.tsx       # 로그아웃 버튼 (Client Component)
lib/
  supabase/
    client.ts             # 클라이언트 컴포넌트용 Supabase 클라이언트
    server.ts             # 서버 컴포넌트/액션용 Supabase 클라이언트
    proxy.ts              # API 라우트용 Supabase 클라이언트
    profiles.ts           # 프로필 DB 함수
  dummy-data.ts           # 더미 데이터 및 헬퍼 함수 (Phase 2 UI용)
  utils.ts                # cn() 등 유틸리티 함수
types/
  database.ts             # 모든 DB 타입 정의 (Event, Announcement, Attendee 등)
docs/
  PRD.md                  # 제품 요구사항 문서
  ROADMAP.md              # 단계별 개발 로드맵
shrimp-rules.md           # AI Agent 전용 개발 규칙 (shrimp-task-manager)
```

## 라우팅 규칙

| 라우트                | 접근 권한                 | 비고                              |
| --------------------- | ------------------------- | --------------------------------- |
| `/`                   | 공개                      | 로그인 시 `/events`로 리디렉션    |
| `/auth/*`             | 공개                      | Google OAuth 전용                 |
| `/events`             | 로그인 필수               | 내 이벤트 목록                    |
| `/events/new`         | 로그인 필수               | 이벤트 생성 폼                    |
| `/events/[id]`        | 공개                      | share_token 기반 비회원 접근 허용 |
| `/events/[id]/manage` | 로그인 필수 + 본인 이벤트 | organizer_id 확인                 |

## Supabase 인증 시스템

이 프로젝트는 **쿠키 기반 세션 관리**를 사용합니다 (`@supabase/ssr` 패키지).

### 클라이언트 선택 규칙

| 환경                                           | import 경로              |
| ---------------------------------------------- | ------------------------ |
| Server Component, Server Action, Route Handler | `lib/supabase/server.ts` |
| Client Component (`'use client'`)              | `lib/supabase/client.ts` |
| API Route Handler                              | `lib/supabase/proxy.ts`  |

- 서버 클라이언트는 **함수 내에서 매번 새로 생성**: `const supabase = await createClient()`
- 클라이언트 컴포넌트에서 `server.ts` import **절대 금지**

### 인증 패턴

```typescript
// 서버 컴포넌트에서 로그인 확인
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/auth/login");
```

```typescript
// 클라이언트 컴포넌트
"use client";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // await 없음
```

## 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## 데이터 모델

### events

`id`, `organizer_id`, `title`, `description`, `location`, `event_date`, `rsvp_deadline`, `max_attendees`, `share_token`, `created_at`

### announcements

`id`, `event_id`, `title`, `content`, `is_pinned`, `created_at`

### attendees

`id`, `event_id`, `user_id(nullable)`, `guest_name(nullable)`, `status(attending|not_attending|maybe|waiting)`, `memo`, `created_at`

## 개발 워크플로우

1. `docs/PRD.md` — 기능 명세 확인
2. `docs/ROADMAP.md` — 현재 단계(Phase) 확인
3. **Phase 순서 필수 준수**: 더미 데이터 UI 완성 → DB 스키마 확정 → 실제 API 연동
4. 작업 완료 후 `docs/ROADMAP.md` 업데이트

## shadcn/ui 컴포넌트 추가

```bash
npx shadcn-ui@latest add <component-name>
```

- 컴포넌트는 `components/ui/`에 생성됩니다
- **`components/ui/` 내 파일 직접 수정 금지**
- 설치된 컴포넌트: Button, Card, Input, Label, Badge, Checkbox, DropdownMenu

## 코딩 스타일

- 2칸 들여쓰기
- TypeScript 필수
- 클라이언트/서버 컴포넌트 분리 명확히 (`'use client'` 지시문)
- 한국어 주석/커밋 메시지
- 변수명/함수명은 영어

## 주의사항

- **Google OAuth만 지원** — 이메일/비밀번호 로그인 UI 추가 금지
- Supabase 서버 클라이언트는 **함수 내에서 매번 새로 생성**
- `.env.local`은 git에 커밋하지 않음
- `NEXT_PUBLIC_*` 변수에 민감한 정보(서비스 롤 키 등) 저장 금지
- 타입은 `types/database.ts`에만 정의 (분산 정의 금지)
