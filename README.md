# Transaction Dashboard Assignment

## 1. 스크린샷

* Notion: https://pouncing-jaguar-da7.notion.site/36e5d4f5ac7a803589e5f9770ae441d1?source=copy_link

---

## 2. 실행 방법

### Mock Server 실행

```bash
cd mock-server
npm install
npm start
```

### Web App 실행

```bash
# mock-server 실행 후
npm install
npm run dev
```

---

## 3. 개발 기록

Github Issue에 작업 과정과 커밋 내역을 순차적으로 정리했습니다.

* Issue 보러가기: https://github.com/iafan1229/payment-system/issues

---

## 4. 프로젝트 구조

### 아키텍처

Feature-first 패턴을 사용했습니다.

### 사용 이유

* 기능별로 관련 파일을 한 곳에 모아 관리할 수 있습니다.
* 특정 기능 수정 시 변경 범위를 쉽게 파악할 수 있습니다.
* 관심사 분리가 명확합니다.
* 새로운 기능 추가 시 동일한 구조로 확장하기 쉽습니다.
* 추후 Feature-Sliced Design(FSD) 구조로 리팩토링 가능한 확장성을 고려했습니다.

```txt
features/
  auth/
    api/
    components/
    hooks/
    store/
    types/

  transactions/
    api/
    components/
      list/
      detail/
        sections/
    hooks/
    lib/
    types/

shared/
  api/
  components/
  hooks/
  lib/
```

---

## 5. 사용한 주요 라이브러리 및 선택 이유

### Tailwind CSS

#### 사용 이유

* Utility-first 방식으로 빠른 UI 개발이 가능합니다.
* 빌드 타임에 CSS가 생성되어 런타임 오버헤드가 적습니다.
* 별도의 CSS 파일 관리 비용을 줄일 수 있습니다.

---

### TanStack Query

#### 사용 이유

* 서버 상태 관리를 효율적으로 처리할 수 있습니다.
* `useInfiniteQuery`를 사용해 cursor 기반 pagination을 구현했습니다.
* `refetchInterval`을 활용해 준실시간 데이터 갱신을 구현했습니다.

---

### Zustand

#### 사용 이유

* 가볍고 간단한 클라이언트 상태 관리가 가능합니다.
* Redux 대비 보일러플레이트가 적습니다.
* auth 상태처럼 전역적으로 필요한 최소 상태만 관리하기 적합하다고 판단했습니다. 
* 전역 상태는 추후에 user, filter, modal 같은 클라이언트 상태가 늘어날 수 있으므로 확장성을 고려하여 의도적으로 추가하였습니다.

---

## 6. Environment 상태 관리 방식

`sandbox` / `production` 환경 상태는 URL query parameter로 관리했습니다.

### 사용 이유

* 현재 화면 상태가 URL에 드러납니다.
* 새로고침, 북마크, 공유, QA 재현이 쉽습니다.
* 리스트와 상세 페이지가 동일한 environment 맥락을 유지하기 쉽습니다.

---

## 7. 준실시간 갱신 방식

TanStack Query의 `refetchInterval`을 사용해 5초마다 서버 데이터를 polling하도록 구현했습니다.

### 사용 이유

* SSE는 별도 endpoint 추가 및 재연결 처리 등 구현 복잡도가 높다고 판단했습니다.
* WebSocket은 양방향 통신 기반으로 이번 과제 규모 대비 기술적 오버헤드가 크다고 판단했습니다.
* Polling은 구현이 가장 단순하며, 5초 주기의 요청은 성능 부담이 크지 않다고 판단했습니다.

---

## 8. API 명세 관련 개선 제안

### Environment 전달 방식 불일치

Transaction list API는 query parameter를 사용하고, Transaction detail API는 `X-Environment` header를 사용하고 있습니다.

```txt
GET /api/transactions?env=sandbox
GET /api/transactions/:id
X-Environment: sandbox
```

동일한 리소스(`/api/transactions`)에서 environment 전달 방식이 달라 API shape의 일관성이 부족하다고 판단했습니다.

---

### 거래 상태 흐름 수정

Pending 이후 실패 상태 흐름을 아래와 같이 수정했습니다.

```txt
created -> authorized -> capture_failed
```

기존:

```txt
authorized -> pending -> authorization_failed
```

#### 수정 이유

`pending` 상태는 이미 authorization이 완료된 상태이므로 이후 `authorization_failed` 이벤트가 발생하는 것은 의미상 어색하다고 판단했습니다.

---

### Seed 데이터: 생성 시각 고정

기존 `seed.js`에서는 `Date.now()`를 사용하여 매 실행마다 생성 시각이 달라졌습니다.

#### 문제점

* `db.json`이 매번 변경됩니다.
* 스냅샷 테스트 및 리뷰 기준 데이터로 활용하기 어렵습니다.

#### 개선 사항

생성 시각을 고정하여 항상 동일한 데이터가 생성되도록 수정했습니다.

---

### Seed 데이터: 최근 30일 데이터 범위 수정

기존 구현은 transaction count가 30을 초과하면 실제 데이터 범위가 30일을 넘어가는 문제가 있었습니다.

#### 개선 사항

실제 최근 30일 범위(4/22 ~ 5/22) 안에서만 데이터가 생성되도록 수정했습니다.

---

## 9. 명세에 없어서 추가로 결정한 사항

### 새로고침 시 로그인 유지

로그인 시 auth token을 HttpOnly cookie에 저장하도록 구현했습니다.

앱 실행 시:

* `getMe()` API를 호출하여 cookie 세션을 검증합니다.
* 유효한 경우 auth store에 user 정보를 복원합니다.

따라서 새로고침 이후에도 로그인 상태가 유지됩니다.

---

### 새로고침 시 environment 유지

environment 상태는 `localStorage`에 저장하도록 구현했습니다.

---

### 실시간 신규 트랜잭션 노출 방식

`refetchInterval` 기반 polling을 사용하여 5초마다 신규 transaction 여부를 감지하도록 구현했습니다.

---

### Production 전환 확인 모달

Production 환경으로 전환 시 confirmation modal을 표시하도록 구현했습니다.

---

### 상세 페이지 실시간 반영

상세 페이지 조회 중 transaction 데이터가 변경되면 최신 데이터를 다시 fetch하여 화면에 반영하도록 구현했습니다.

---

## 10. 의도적으로 단순화하거나 생략한 부분

### 토큰 만료 처리

추가 시간이 있었다면 아래 기능을 구현하고 싶었습니다.

* access token 만료 처리
* 자동 로그아웃
* refresh token 기반 재발급 처리

다만 이번 과제는 mock token 기반 인증 구조였기 때문에, 토큰 만료 처리까지 구현하는 것은 과한 범위라고 판단하여 제외했습니다.
