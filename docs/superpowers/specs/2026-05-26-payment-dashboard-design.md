# 결제 대시보드 설계

**날짜:** 2026-05-26  
**범위:** 프론트엔드 앱 초기 구조, 인증/세션 모델, 환경 상태, 트랜잭션 데이터 흐름, 과제용 대시보드 구현 순서

## 목표

다음 기능을 지원하는 프론트엔드 어드민 대시보드를 만든다.

- 로그인
- 새로고침 후 세션 유지
- `sandbox` / `production` 환경 전환
- 트랜잭션 목록의 준실시간 갱신
- 타임라인 데이터를 포함한 트랜잭션 상세 조회

구현 완성도뿐 아니라, README에서 의사결정 근거를 명확하게 설명할 수 있는 구조를 우선한다.

## 선택한 스택

- **프레임워크:** Next.js + TypeScript
- **서버 상태:** React Query
- **전역 클라이언트 상태:** Zustand
- **인증 전달 방식:** `httpOnly` cookie

## 왜 이런 구조로 가는가

이 프로젝트에는 성격이 다른 상태가 세 종류 있다.

- **인증/세션 상태**
- **탐색 상태**
- **서버 데이터**

각 책임은 의도적으로 나눈다.

- **Zustand**는 여러 화면에서 즉시 공유해야 하는 가벼운 클라이언트 상태만 보관한다.
- **URL**은 현재 선택한 환경을 보관한다. 이 값은 비밀값이 아니라 탐색 상태이기 때문이다.
- **React Query**는 트랜잭션 데이터를 보관한다. 이 데이터는 캐싱, 재조회, polling이 필요하기 때문이다.
- **`httpOnly` cookie**는 인증 토큰을 보관한다. 그래서 프론트엔드 코드가 토큰을 직접 읽거나 쓰지 않게 한다.

## 인증 설계

### 서버 엔드포인트

- `POST /api/auth/login`
  - 자격 증명을 검증한다.
  - `httpOnly` 인증 쿠키를 설정한다.
  - `{ user }`를 반환한다.
- `GET /api/auth/me`
  - 인증 쿠키를 읽는다.
  - 세션이 유효하면 현재 `{ user }`를 반환한다.
  - 세션이 없거나 유효하지 않으면 `401`을 반환한다.
- `POST /api/auth/logout`
  - 인증 쿠키를 비운다.
  - 성공 응답을 반환한다.

### 클라이언트 인증 상태

Zustand에는 아래 값만 저장한다.

- `user`
- `isAuthResolved`
- `setUser`
- `clearUser`

토큰 자체는 Zustand, `localStorage`, `sessionStorage` 어디에도 저장하지 않는다.

### 인증 부트스트랩

앱 시작 시:

1. `credentials: 'include'`와 함께 `GET /api/auth/me`를 호출한다.
2. 성공하면 `user`를 Zustand에 저장한다.
3. `401`이 오면 `user`를 비운다.
4. `isAuthResolved=true`로 바꾼다.

이렇게 하면 새로고침 후 상태 복원이 서버 쿠키 세션과 일치하게 된다.

## 환경 상태 설계

### 기준 상태

현재 선택된 환경은 페이지 URL에 저장한다.

예시:

- `/transactions?env=sandbox`
- `/transactions?env=production`

### 대체 동작

URL에 `env`가 없으면:

1. `localStorage`에서 마지막으로 선택한 값을 읽는다.
2. 값이 있으면 즉시 URL에 반영한다.
3. 값이 없으면 기본값은 `sandbox`로 둔다.

### 전역 저장소 전용이 아니라 URL을 쓰는 이유

- 새로고침 후에도 유지된다.
- 뒤로가기/앞으로가기와 자연스럽게 맞물린다.
- 목록/상세 화면이 같은 환경 맥락을 공유하기 쉽다.
- 딥링크와 QA 재현이 쉬워진다.

## 트랜잭션 데이터 설계

### 쿼리 소유권

트랜잭션 데이터는 Zustand가 아니라 React Query가 관리한다.

권장 query key:

- 목록: `['transactions', env]`
- 상세: `['transaction', env, id]`

### 준실시간 갱신

- 목록 화면은 polling을 사용한다.
- 상세 화면은 트랜잭션이 `pending`일 때만 polling한다.

권장 초기 주기:

- 목록: `5000ms`
- 상세 (`pending`일 때): `5000ms`
- 상세 (`pending`이 아닐 때): polling 없음

이 정도면 “수십 초 이내 반영” 요구사항을 만족하면서 구현과 설명도 단순하게 가져갈 수 있다.

## 페이지 구조

### 1. 로그인 페이지

- 이메일/비밀번호 폼
- `credentials: 'include'`로 제출
- 성공 시:
  - Zustand `setUser(user)`
  - 대시보드로 이동
- 실패 시:
  - 인라인 에러 메시지 표시

### 2. 보호된 앱 셸

- auth bootstrap이 끝날 때까지 대기
- 인증되지 않았으면 `/login`으로 리다이렉트
- 인증되었으면 대시보드 라우트를 렌더링

### 3. 대시보드 목록 페이지

- 환경 전환 스위처
- 트랜잭션 테이블
- 로딩 / 에러 / 빈 상태
- polling 기반 갱신
- 행 클릭 시 상세 페이지 이동

### 4. 트랜잭션 상세 페이지

- 금액, 상태, 시각, ID
- 고객 정보
- 결제 수단
- 이벤트 타임라인
- `pending`일 때만 조건부 polling

## API 사용 규칙

- 인증이 필요한 모든 fetch 호출은 `credentials: 'include'`를 사용한다.
- 목록: `GET /api/transactions?env=...&limit=...&cursor=...`
- 상세: `GET /api/transactions/:id?env=...`
- `env`는 목록과 상세 모두에서 일관되게 query parameter로 전달한다.

## 초기 구현 순서

1. `mock-server`에 `GET /api/auth/me`, `POST /api/auth/logout` 추가
2. Next.js + TypeScript 프론트엔드 스캐폴딩
3. React Query와 Zustand 설치 및 설정
4. `/api/auth/me`를 이용한 auth bootstrap 구현
5. `/login` 구현
6. 보호 레이아웃 / 리다이렉트 동작 구현
7. `localStorage` 대체 동작이 있는 `env` URL 훅 구현
8. polling이 있는 트랜잭션 목록 페이지 구현
9. 조건부 polling이 있는 트랜잭션 상세 페이지 구현
10. 구현과 함께 README 의사결정 근거 정리

## 테스트 전략

### Mock 서버

- Node 테스트는 `mock-server/test/` 아래에 둔다.
- auth cookie 동작을 검증한다.
- `env` 파싱을 검증한다.
- `limit` 파싱을 검증한다.
- pending 전이 이벤트 동작을 검증한다.

### 프론트엔드

- 로그인 성공/실패 smoke test
- `/api/auth/me`로 새로고침 후 세션이 복원되는지 확인
- env 전환 시 목록 쿼리가 바뀌는지 확인
- 목록 polling이 새 거래나 상태 변경을 반영하는지 확인
- 상세 polling이 트랜잭션이 `pending`이 아니게 되면 멈추는지 확인

## 구현하면서 README에 남길 내용

- 왜 인증 토큰을 cookie로 옮겼는지
- 왜 `user`는 Zustand에 두고 트랜잭션은 두지 않았는지
- 왜 `env`를 URL 기반으로 설계했는지
- 왜 SSE/WebSocket 대신 polling을 선택했는지
- API의 어떤 비일관성을 왜 수정했는지

## 첫 번째 패스에서 제외하는 것

- 복잡한 역할/권한 모델
- 사용자별 트랜잭션 분리
- optimistic update
- WebSocket 또는 SSE 기반 전송
- 클라이언트 측 토큰 영속 저장
