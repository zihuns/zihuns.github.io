---
title: "TDD문화 도입 | (2) 주간 커버리지 관리"
contribution: 60
date: 2025-08-10 01:00:00 +0900
lastmod: 2025-09-22 14:30:00 +0900
start_date: 2025-07-29
end_date: 2025-07-30
categories: [Frontend, Test]
tags: [TDD, Vitest, 테스트, 프론트엔드, CI]
excerpt: "Vitest 기반 TDD 도입 경험과 시행착오, 그리고 테스트 문화 정착 과정을 공유합니다."
---

> 📌 이 글은 **TDD 시리즈** 중 2편입니다.  
> 1편: [Vitest](/posts/tdd_vitest)  
> 3편: [파이프라인 구축 (GitLab CI 활용)](/posts/tdd_gitlab)

---

## 1. 문제 상황 또는 동기 (Motivation)
- 기존에는 테스트코드의 필요성을 크게 느끼지 못했으나, 실제 서비스 운영 중 잦은 회귀 버그와 코드 변경에 대한 불안감이 있었습니다.
- "모닥불 테스트코드" 영상과 "프런트엔드 개발을 위한 테스트 입문" 서적을 접하며 테스트의 중요성을 인식하게 되었습니다.

---

## 2. 목표 및 요구사항 (Goal & Requirements)
- 신규 기능/버그 수정 시 TDD 사이클을 적용하여 품질을 높이고자 함
- AI 에이전트를 활용해 SB 기반의 요건 및 기능 중심 테스트케이스를 생성(AAA 패턴 적용)
- 커버리지 변화 추이를 관리할 수 있는 대시보드 구축
- GitLab CI에 테스트 검증 프로세스 추가

---

## 3. 구현 과정 (Implementation)

### 3.1 주요 코드/로직 설명
- Vitest 환경에서 SB 기반 테스트케이스를 작성하고, AAA 패턴을 적용

```js
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,          // describe, it 글로벌 사용
    environment: 'jsdom',   // 브라우저 API 모킹
    setupFiles: ['./tests/setup.ts'], // 공통 초기화
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['tests/**']
    }
  }
})
```

```js
// AAA 패턴 예시
describe('주문 버튼', () => {
  it('클릭 시 주문 요청을 전송한다', async () => {
    // Arrange
    render(<OrderButton />)
    // Act
    await userEvent.click(screen.getByRole('button', { name: /주문/i }))
    // Assert
    expect(fetchSpy).toHaveBeenCalledWith('/api/order')
  })
})
```

### 3.2 시행착오/트러블슈팅
- 통합 테스트로 매장 결함을 찾으려 했으나 시나리오 복잡도로 실패
- playwright-MCP 기반 E2E 시도 → 동적 컴포넌트 세팅 탓에 일관성 부족
- 단위 테스트(TDD)부터 시작해 E2E/UI로 확장하기로 결정
- Options API로 작성된 기존 컴포넌트 테스트가 Composition API 전환으로 실패 → Composition API 전용 global setup 구성 후 재작성
- 완성된 컴포넌트에 AI로 테스트를 “역-작성”하는 규칙을 사용했으나 → TDD 흐름과 맞지 않아 SB 기반 요건 → 테스트 순서로 규칙 변경

---

## 4. 결과 및 느낀 점 (Result & Retrospective)
- TDD 도입 후 신규 기능/버그 수정 시 안정감이 크게 향상됨
- SB 기반 테스트케이스가 요건 문서 역할을 하여, 협업 및 코드 리뷰가 쉬워짐
- 테스트 목적과 범위에 대해 명확히 고민하게 되었고, 코드 품질에 대한 인식이 높아짐
- 커버리지 관리 대시보드로 테스트 사각지대를 빠르게 파악할 수 있었음
- 앞으로는 E2E 및 UI 테스트 자동화까지 점진적으로 확대할 계획

---

## 5. 기술 스택 (Tech Stack)

`Next.js` `TypeScript` `React` `Webpack` `CoreUI/React`  
`Vue` `JavaScript` `Vite` `Vitest` `@vue/test-utils` `Vitest/ui` `Vitest/coverage-v8`  
`GitLab` `GitLab CI` `Docker`

---

## 6. 참고 자료 (References)
- [Vitest 공식 문서](https://vitest.dev/)
- [모닥불 테스트코드 유튜브](https://www.youtube.com/watch?v=Q1b6TC5rQnA)
- [프런트엔드 개발을 위한 테스트 입문](https://book.naver.com/bookdb/book_detail.nhn?bid=22527816)



