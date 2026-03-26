# Development Guidelines

## 프로젝트 개요

- **서비스**: 소규모 모임 이벤트 관리 웹 (주최자가 이벤트 생성/관리, 참여자는 비회원으로 공유 링크를 통해 응답)
- **스택**: Next.js 15 (App Router) + React 19 + TypeScript + Supabase + shadcn/ui + Tailwind CSS
- **인증**: Google OAuth 전용 (이메일/비밀번호 로그인 없음)
- **배포**: Vercel

---

## 프로젝트 아키텍처

### 디렉토리 구조

```
app/                    # Next.js App Router 페이지
  auth/                 # 인증 라우트 (공개)
  protected/            # 로그인 필수 라우트 (임시 보호 페이지)
  events/               # 이벤트 라우트 (개발 예정)
    page.tsx            # 이벤트 목록 (로그인 필요)
    new/page.tsx        # 이벤트 생성 (로그인 필요)
    [id]/page.tsx       # 이벤트 상세 (공개 - share_token 기반)
    [id]/manage/page.tsx # 이벤트 관리 (로그인 필요 + 본인 이벤트)
components/             # React 컴포넌트
  ui/                   # shadcn/ui 기반 컴포넌트 (직접 수정 금지)
lib/
  supabase/
    client.ts           # 클라이언트 컴포넌트용 Supabase 클라이언트
    server.ts           # 서버 컴포넌트/액션용 Supabase 클라이언트
    proxy.ts            # API 라우트용 Supabase 클라이언트
    profiles.ts         # 프로필 관련 DB 함수
types/
  database.ts           # TypeScript 타입 정의 (모든 DB 타입은 여기에)
docs/
  PRD.md                # 제품 요구사항 문서 (기능 추가 시 반드시 참조)
  ROADMAP.md            # 개발 로드맵 (작업 완료 후 반드시 업데이트)
```

---

## 라우팅 규칙

### 접근 제어 분류

| 라우트                | 접근 권한                     | 인증 방법                               |
| --------------------- | ----------------------------- | --------------------------------------- |
| `/`                   | 공개                          | 없음                                    |
| `/auth/*`             | 비로그인 전용                 | 없음                                    |
| `/events`             | **로그인 필수**               | 서버에서 `supabase.auth.getUser()` 확인 |
| `/events/new`         | **로그인 필수**               | 서버에서 `supabase.auth.getUser()` 확인 |
| `/events/[id]`        | **공개** (비회원 포함)        | share_token 기반 URL                    |
| `/events/[id]/manage` | **로그인 필수 + 본인 이벤트** | organizer_id 일치 확인                  |

### 인증 확인 패턴 (서버 컴포넌트)

```typescript
// 로그인 필수 페이지 패턴
const supabase = await createClient(); // lib/supabase/server.ts
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/auth/login");

// 본인 이벤트 확인 패턴
const { data: event } = await supabase
  .from("events")
  .select("organizer_id")
  .eq("id", params.id)
  .single();
if (!event || event.organizer_id !== user.id) redirect("/events");
```

---

## Supabase 클라이언트 사용 규칙

### **핵심 규칙: 환경에 따라 반드시 올바른 클라이언트 사용**

| 사용 환경                                      | import 경로              | 금지 사항              |
| ---------------------------------------------- | ------------------------ | ---------------------- |
| Server Component, Server Action, Route Handler | `lib/supabase/server.ts` | 브라우저에서 사용 금지 |
| Client Component (`'use client'`)              | `lib/supabase/client.ts` | 서버에서 사용 금지     |
| API Route Handler                              | `lib/supabase/proxy.ts`  | -                      |

- **서버 클라이언트는 함수 내에서 매번 새로 생성** (`const supabase = await createClient()`)
- 클라이언트 컴포넌트에서 `lib/supabase/server.ts` import **절대 금지**
- 서버 컴포넌트에서 `lib/supabase/client.ts` import **절대 금지**

---

## 타입 정의 규칙

### **모든 DB 타입은 `types/database.ts`에 정의**

```typescript
// types/database.ts에 추가할 타입 예시
export type Event = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string;
  event_date: string;
  rsvp_deadline: string | null;
  max_attendees: number | null;
  share_token: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  event_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

export type Attendee = {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  status: "attending" | "not_attending" | "maybe" | "waiting";
  memo: string | null;
  created_at: string;
};
```

- 새 DB 타입 추가 시 반드시 `types/database.ts`에 추가
- `status` 필드는 리터럴 유니온 타입 사용 (`"attending" | "not_attending" | "maybe" | "waiting"`)

---

## 컴포넌트 생성 규칙

### 위치 결정 기준

| 컴포넌트 종류             | 위치                                                 |
| ------------------------- | ---------------------------------------------------- |
| shadcn/ui 기본 컴포넌트   | `components/ui/` (npx shadcn-ui@latest add로만 추가) |
| 인증 관련 폼              | `components/` (루트)                                 |
| 이벤트 전용 공통 컴포넌트 | `components/events/`                                 |
| 페이지 전용 컴포넌트      | 해당 `app/` 디렉토리 내                              |

### 서버/클라이언트 컴포넌트 결정

- **기본값: Server Component** (데이터 페칭, 인증 확인)
- **Client Component 사용 조건**: useState, useEffect, 이벤트 핸들러, 브라우저 API 필요 시에만
- Client Component는 파일 최상단에 반드시 `'use client'` 선언

---

## 개발 워크플로우 규칙

### **단계별 순서 필수 준수**

1. **Phase 1**: 라우트 구조 및 빈 페이지 생성
2. **Phase 2**: 더미 데이터로 UI/UX 완성 먼저
   - `lib/dummy-data.ts` 파일에 더미 데이터 작성
   - UI 검토 완료 전까지 실제 DB 연동 금지
3. **Phase 3**: UI 검토 후 DB 스키마 확정 → Supabase 마이그레이션 → 실제 API 연동
4. 각 Task 완료 후 반드시 ROADMAP.md 업데이트

### **테스트 규칙**

- API 연동, 비즈니스 로직 구현 시 **Playwright MCP 테스트 필수**
- 테스트 시나리오는 Task 생성 시 "테스트 체크리스트" 섹션에 미리 작성
- E2E 테스트 완료 전 Task 완료 처리 금지

---

## 데이터 모델 참조

### 핵심 테이블 (PRD 기준)

- **events**: `id`, `organizer_id`, `title`, `description`, `location`, `event_date`, `rsvp_deadline`, `max_attendees`, `share_token`, `created_at`
- **announcements**: `id`, `event_id`, `title`, `content`, `is_pinned`, `created_at`
- **attendees**: `id`, `event_id`, `user_id(nullable)`, `guest_name(nullable)`, `status`, `memo`, `created_at`

### share_token 규칙

- 이벤트 생성 시 자동 생성 (UUID 또는 nanoid)
- `/events/[id]` 페이지는 share_token으로도 접근 가능해야 함
- RLS 정책: share_token 보유자는 이벤트 조회 가능

---

## 파일 동시 수정 규칙

| 작업                       | 동시에 수정해야 하는 파일                        |
| -------------------------- | ------------------------------------------------ |
| 새 DB 타입 추가            | `types/database.ts`                              |
| 새 Supabase 쿼리 함수 추가 | `lib/supabase/[기능명].ts` 생성                  |
| 새 라우트 추가             | `app/[경로]/page.tsx` + `docs/ROADMAP.md`        |
| shadcn/ui 컴포넌트 추가    | `npx shadcn-ui@latest add` 실행 (수동 생성 금지) |
| 환경 변수 추가             | `.env.local` + `CLAUDE.md`의 환경 변수 섹션      |

---

## shadcn/ui 컴포넌트 사용 규칙

- 컴포넌트 추가: `npx shadcn-ui@latest add <component-name>` 명령만 사용
- `components/ui/` 내 파일 직접 수정 금지 (라이브러리 업데이트 시 덮어씌워짐)
- 이미 설치된 컴포넌트: Button, Card, Input, Label, Badge, Checkbox, DropdownMenu
- 추가 필요 예정: Dialog, Select, Textarea, Tabs, Toast, Avatar, Calendar

---

## 인증 시스템 규칙

- **Google OAuth만 지원** (이메일/비밀번호 로그인 UI 추가 금지)
- OAuth 콜백: `app/auth/callback/route.ts` (수정 시 PKCE 코드 교환 로직 유지)
- 로그인 성공 후 리디렉션: `/events` (이벤트 목록 페이지)
- 로그아웃 후 리디렉션: `/` (홈 페이지)
- 비회원 참여자는 로그인 없이 `share_token` URL로만 이벤트 접근

---

## AI 의사결정 기준

### 컴포넌트 위치 결정

```
데이터 페칭이 필요한가?
  → YES: Server Component (기본)
  → NO: 인터랙션(클릭, 입력)이 필요한가?
    → YES: Client Component ('use client' 추가)
    → NO: Server Component (기본)
```

### Supabase 클라이언트 선택

```
현재 파일 상단에 'use client'가 있는가?
  → YES: lib/supabase/client.ts 사용
  → NO: lib/supabase/server.ts 사용 (await createClient())
```

### 새 기능 추가 시 우선순위

1. `docs/PRD.md`에서 해당 기능 명세 확인
2. `docs/ROADMAP.md`에서 현재 단계(Phase) 확인
3. Phase 순서 준수 (Phase 2 UI 완성 전 DB 연동 금지)
4. 구현 완료 후 `docs/ROADMAP.md` 업데이트

---

## 금지 사항

- `components/ui/` 파일 직접 수정 금지
- 서버/클라이언트 Supabase 클라이언트 혼용 금지
- Phase 순서 무시하고 바로 DB 연동 구현 금지 (더미 데이터 UI 먼저)
- `types/database.ts` 외 파일에 DB 타입 중복 정의 금지
- Google OAuth 외 인증 방법(이메일/비밀번호 등) 추가 금지
- `.env.local` 파일 git 커밋 금지
- `NEXT_PUBLIC_*` 환경 변수에 민감한 정보(서비스 롤 키 등) 저장 금지
- API 연동 작업 시 Playwright MCP 테스트 없이 Task 완료 처리 금지
- 더미 데이터 단계에서 실제 Supabase 쿼리 호출 코드 작성 금지
