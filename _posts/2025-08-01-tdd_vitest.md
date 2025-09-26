---
title: "TDD문화 도입 | (1) Vitest 전환과 커버리지 기반 품질 관리"
contribution: 75
members: 3
role: Lead
date: 2025-08-01 01:00:00 +0900
lastmod: 2025-09-26 14:30:00 +0900
start_date: 2025-06-20
end_date:
categories: [Frontend, Test, TDD]
tags: [Vitest, Jest, Coverage, Vue.js, TDD, CI]
excerpt: "Vue2 기반 프로젝트에서 Jest를 Vitest로 전환하며 TDD 문화를 정착시키고, 커버리지 기반 품질 관리 체계를 구축한 과정을 공유합니다."
---

> 📌 이 글은 **TDD 시리즈** 중 1편입니다.  
> 2편: [주간 커버리지 관리](/posts/tdd_bigbro)  
> 3편: [커버리지 측정 및 자동화 시스템 구축 (GitLab + Vitest)](/posts/tdd_gitlab)

---

## 1. 문제 상황 또는 동기 (Motivation)
- 기존에는 테스트 코드의 필요성을 크게 느끼지 못했으나, 실제 서비스 운영 중 **잦은 회귀 버그와 코드 변경에 대한 불안감**이 있었습니다.
- **모닥불 테스트코드** 영상과 **프런트엔드 개발을 위한 테스트 입문** 서적을 접하며 테스트의 중요성을 인식하게 되었습니다.
- 기존 Jest 환경은 다음과 같은 한계가 있었습니다:
  - 설정이 복잡하고 느린 테스트 속도
  - Vue2 SFC 지원의 불편함
  - CI/CD 파이프라인에서의 실행 비용 증가

👉 이런 문제를 해결하고자 **Vitest 전환 + TDD 문화 도입**을 결정했습니다.

---

## 2. 목표 및 요구사항 (Goal & Requirements)
- 신규 기능/버그 수정 시 **TDD 사이클**을 적용하여 품질을 높임  
- **AI 에이전트 기반 SB(Test Spec) → AAA 패턴 테스트케이스 자동화**  
- **커버리지 변화 추이를 관리**할 수 있는 대시보드 구축  
- GitLab CI에 **자동 테스트 검증 프로세스** 추가  
- 최종적으로는 **60% 이상 커버리지 달성** 및 장기적 TDD 문화 정착  

---

## 3. 구현 과정 (Implementation)

### 3.1 Vitest 환경 설정

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,          
    include: ['__vitest__/**/*.test.{js,ts,tsx}'],
    reporters: ['default', 'junit'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json-summary', 'text', 'cobertura'],
    }
  }
})
```
{: file="vitest.config.js"}

### 3.2 테스트코드 표준화

#### 📂 디렉토리 구조
- 모든 테스트 파일은 `__vitest__` 디렉토리에 위치  
- 파일 네이밍: `*.test.js`, `*.spec.js`  
- 소스 코드와 테스트 코드가 **1:1 매핑**되도록 동일한 폴더 구조 유지  

#### ✍ 작성 규칙
```js
describe("컴포넌트명.vue", () => {
  describe("모듈 노출케이스", () => {
    // 정상 케이스
  });
  describe("모듈 비노출케이스", () => {
    // 예외 상황
  });
  describe("기능 검증", () => {
    // 세부 기능
  });
});
```
{: file="example.test.js"}
```js
describe("TravelSearch.vue", () => {
  describe("기능 검증", () => { 
    it("정상 데이터 입력 시 결과가 노출된다", async () => {
      // Arrange
      const wrapper = mount(TravelSearch, { props: { query: "제주" } })
      // Act
      await wrapper.find("button.search").trigger("click")
      // Assert
      expect(wrapper.find(".result").exists()).toBe(true)
    })
  });
})
```
{: file="AAA패턴"}

<details>
<summary>Vitest 테스트 코드 작성 규칙(Cursor, Cline rules)</summary>
<div markdown="1">

## 절대 원칙
테스트 파일을 제외한 다른 파일은 수정하면 안된다

## 0. TDD(Test Driven Development) 방법론
### 기본 원칙
- 모든 기능/버그 수정 시에도 TDD 사이클(Red-Green-Refactor)을 따른다.

### 작업 순서
1. SB 작성 완료 후:
  - 요건을 정리하여 테스트 코드를 먼저 작성한다.
  - 이 시점의 테스트는 반드시 실패(Red)해야 한다.

2. 데이터 스키마 수신 후:
  - 정상 케이스, 비정상 케이스에 대한 테스트 데이터를 세팅한다.
  - 각 케이스별 예상 결과를 명확히 정의한다.

3. 실제 구현:
  - 작업 진행 중 테스트 성공(Green)을 지속적으로 확인한다.
  - 모든 케이스에 대해 테스트가 통과하는지 확인한다.

4. 리팩토링:
  - 코드 품질 개선
  - 테스트 유지 보수

## 1. 파일 위치 및 네이밍
- 테스트 파일은 소스와 동일한 폴더에 `*.test.js`, `*.test.ts`, `*.spec.js`, `*.spec.ts` 또는 `__vitest__` 폴더에 작성한다.
- 예시: `Button.test.js`, `utils.spec.ts`

## 2. 테스트 구조
- `describe`로 테스트 단위(컴포넌트/함수)를 그룹화한다.
- 동일 컴포넌트/함수 내에서도 "주요 기능 단위"로 describe를 분리하여 작성한다. (예: 노출 조건, 데이터 변환, 이벤트 등)
- `it` 또는 `test`로 개별 동작을 명확히 작성한다.

## 2-1. describe 대분류 작성 권장
- 컴포넌트 테스트 시, 주요 시나리오별로 describe 블록을 아래와 같이 크게 구분하여 작성한다.
  - **모듈 노출케이스**: 정상적으로 모듈이 노출되는 조건/상황을 검증
  - **모듈 비노출케이스**: 필수 데이터 미존재 등으로 모듈이 노출되지 않는 조건을 검증
  - **기능 검증**: 스타일, 동작, 이벤트 등 세부 기능을 검증
- 예시:
  ```js
  describe("모듈명.vue", () => {
    describe("모듈 노출케이스", () => { ... });
    describe("모듈 비노출케이스", () => { ... });
    describe("기능 검증", () => { ... });
  });
  ```
- 실제 예시는 __vitest__/travel_search.test.js 참고

## 3. AAA 패턴 적용
- Arrange(준비), Act(실행), Assert(검증) 순서로 작성한다.

## 4. 단일 책임 원칙
- 하나의 테스트는 하나의 동작만 검증한다.

## 5. 명확한 테스트명
- 테스트 목적이 드러나도록 한글 또는 영어로 명확하게 작성한다.

## 6. Mock/Stub 적극 활용
- 외부 의존성(네트워크, 타 모듈 등)은 mocking/stubbing 한다.

## 7. 비동기 테스트는 async/await 사용
- 비동기 함수 테스트 시 `async/await`을 사용한다.

## 8. 스냅샷 테스트는 신중하게 사용
- UI 변경이 잦은 경우 스냅샷 테스트는 최소화한다.

## 9. 테스트 커버리지 목표
- 전체 커버리지 80% 이상을 목표로 한다.

## 10. 테스트 독립성 보장
- 테스트 간 상태를 공유하지 않는다.
- 각 테스트는 독립적으로 실행되어야 한다.

</div>
</details>

### 3.3 커버리지 기반 품질 관리
- v8 provider 기반 커버리지 측정
- HTML + JSON 보고서 생성
- GitLab CI/CD와 연동하여 MR 시점 자동 검증
- 주간 커버리지 집계 → Bigbro 대시보드에 업로드

**실제 시뮬레이션 예시**
- 전체 코드: 206,410 LOC
- 컴포넌트 코드: 128,163 LOC (543개 파일)
- 컴포넌트 100% 테스트 시 전체 커버리지: 62.1%
- 파일 1개(236 LOC) 테스트 → 전체 커버리지 약 0.11%p 상승

### 3.4 시행착오/트러블슈팅
- **E2E 기반으로 출발했다가 실패**
  - Playwright-MCP 활용 → 동적 컴포넌트 설정 탓에 일관성 부족
  - 단위 테스트(TDD)부터 시작 → 점진적으로 UI/E2E 확장 전략으로 전환
- **Composition API 전환**
  - Options API 기반 테스트가 깨짐
  - Composition API 전용 global setup을 구성해 해결
- **AI 역-작성 규칙 문제**
  - 기존 코드에 맞춰 테스트를 생성 → TDD 흐름과 맞지 않음
  - SB 기반 요건 → 테스트 순서로 프로세스를 수정
- **Node 버전 이슈**
  - Node 16 환경에서는 Vitest 2.x 실행 불가
  - Node 18+에서 정상 동작, 이후 Node 22 업그레이드 완료

---

### 4. 결과 및 느낀 점 (Result & Retrospective)
- TDD 도입 후 신규 기능/버그 수정 시 **안정감**이 크게 향상됨
- SB 기반 테스트케이스가 **요건 문서 역할**을 하여 협업 및 코드 리뷰 효율 증가
- 테스트 목적과 범위를 고민하게 되면서 **코드 품질 인식 제고**
- 커버리지 관리 대시보드로 **테스트 사각지대 파악 용이**
- Vitest 전환을 통해 **테스트 실행 속도 및 DX 개선**
- 앞으로는 **E2E/UI 테스트 자동화**까지 확장 계획

---

### 5. 기술 스택 (Tech Stack)

`Vue` `JavaScript` `Vite` `Vitest` `@vue/test-utils` `Vitest/ui` `Vitest/coverage-v8`

`Next.js` `TypeScript` `React` `Webpack` `CoreUI/React`

`GitLab` `GitLab CI` `Docker`

---

### 6. 참고 자료 (References)
- [Vitest 공식 문서](https://vitest.dev/guide/)
- [Best Techniques](https://dev.to/wallacefreitas/best-techniques-to-create-tests-with-the-vitest-framework-9al)
- [프론트엔드 개발에서 테스트 자동화, 꼭 해야 할까? EP.3 모닥불](https://toss.tech/article/firesidechat_frontend_3)
- [프런트엔드 개발을 위한 테스트 입문](https://product.kyobobook.co.kr/detail/S000213500949)

---

### 🥇중간 성과 (Interim Achievements)
- 9월 9일 커버리지 20% 돌파
- 9월 26일 팀원들과의 협업으로 현재 커버리지 25% 이상 달성

> **추신.** 
> 
> 본 게시물의 기여도 75%는 초기 Vitest 환경 설정, 테스트 표준화, TDD 문화 도입 등
> 전체적인 테스트 시스템을 구축하고 초기 테스트 코드(커버리지 16.9%)를 작성한 기여를 의미합니다."
> 
> 함께 더 나은 테스트코드를 위해 힘써주시는 준희님(Core Contributor)과 한나님(Contributor)께 감사를 전합니다.😊
{: .prompt-tip }

