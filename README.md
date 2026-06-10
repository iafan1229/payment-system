# 결제 플랫폼 어드민 대시보드

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
