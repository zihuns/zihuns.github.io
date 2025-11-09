---
title: "TDD문화 도입 | (2) 주간 커버리지 대시보드로 시각화하기"
contribution: 60
members: 2
date: 2025-08-10 01:00:00 +0900
lastmod: 2025-09-22 14:30:00 +0900
start_date: 2025-07-29
end_date: 2025-07-30
categories: [Frontend, Test]
tags: [TDD, coverage, Next.js, TypeScript, vitest, bigbro]
excerpt: "Vitest 기반 TDD 도입 경험과 시행착오, 그리고 테스트 문화 정착 과정을 공유합니다."
---

> 📌 이 글은 **TDD 시리즈** 중 2편입니다.  
> 1편: [Vitest 전환과 커버리지 기반 품질 관리](/posts/tdd_vitest)  
> 3편: [커버리지 측정 및 자동화 시스템 구축 (GitLab + Vitest)](/posts/tdd_gitlab)  
> 4편: [Tech 발표, Vitest로 안정적인 프론트엔드 개발하기](/posts/tdd_ppt)

---

## 1. 개요

사내 BigBro UI는 **Next.js + TypeScript** 기반의 프론트엔드 모니터링 시스템입니다.  
이번 개선 작업에서는 **테스트 커버리지 데이터의 접근성과 가시성**을 높이는 것을 목표로 했습니다.  

특히 `Vitest coverage-summary.json`을 **S3에 적재**하고, 이를 Bigbro UI에서 시각화하여 팀 단위로 커버리지를 손쉽게 확인할 수 있도록 개선했습니다.

![주간 대시보드](/assets/img/tdd_bigbro/tdd_bigbro_3.png)

---

## 2. 주요 개선 사항

### 2.1 환경별 동적 설정
```tsx
const useCoverage = () => {
  const PLUGIN_URL = process.env.NEXT_PUBLIC_PLUGIN_URL;

  return useQuery(['coverage'], async () => {
    const response = await fetch(`${PLUGIN_URL}/api/coverage`);
    return response.json();
  });
};
```
{: file="useCoverage.tsx" }
- 환경 변수를 통한 플러그인 URL 동적 설정
- 개발/테스트/운영 환경별 설정 분리
- Next.js 환경 변수 시스템 활용

---

### 2.2 사이드바 네비게이션 개선
```tsx
interface CoverageTree {
  [year: string]: {
    [month: string]: Array<{
      file: string;
      week: string;
      text: string;
    }>;
  };
}

const Sidebar: React.FC = () => {
  const getCoverageTree = (coverList: string[]) => {
    const tree: CoverageTree = {};
    // 파일명을 연도-월-주차 구조로 변환
    // ...
  };

  return (
    // 트리 구조 UI 렌더링
  );
};
```
{: file="Sidebar.tsx" }
- 트리 구조 기반 네비게이션 제공
- 커버리지 파일명을 연도 → 월 → 주차 계층으로 변환
- 데이터 탐색 및 히스토리 추적 용이

<table>
  <thead>
    <tr>
      <th style="text-align: center">AS-IS</th>
      <th style="text-align: center">TO-BE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align: top;"><img src="/assets/img/tdd_bigbro/tdd_bigbro_1.png" alt="AS-IS" width="250px"></td>
      <td style="vertical-align: top;"><img src="/assets/img/tdd_bigbro/tdd_bigbro_2.png" alt="TO-BE" width="250px"></td>
    </tr>
  </tbody>
</table>

---

### 2.3 테이블 정렬 기능

```tsx
const CoverageTable: React.FC<Props> = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'lines',
    direction: 'desc'
  });

  const handleSort = (column: keyof CoverageMetrics) => {
    // 정렬 로직 구현
  };

  return (
    // 테이블 UI 렌더링
  );
};
```
{: file="index.tsx" }
- 컬럼 정렬 기능으로 커버리지 지표 분석 편의성 향상
- 타입 안전성을 확보하여 런타임 에러 최소화
- 직관적인 데이터 분석 경험 제공

---

### 2.4 주차별 데이터 변환

```tsx
const weekLabelFromFile = (filename: string): string => {
  const match = filename.match(/^coverage-(\d{4})-(\d{2})-(\d+)w\.json$/);
  return match ? `${match[1]}년 ${parseInt(match[2])}월 ${match[3]}주차` : filename;
};
```
{: file="Sidebar.tsx" }
- 커버리지 파일명을 주차 단위 라벨로 변환
- UI에서 히스토리 기반 탐색 가능
- 가독성과 유지보수성 향상

---

## 3. 개선 효과

- 환경별 설정 관리로 안정성 향상
- UI 개선으로 데이터 탐색성 강화
- 정렬/트리 구조/주차별 라벨링으로 팀 협업 생산성 증가

---

## 🗓️ 업데이트 내역

- **2025-08-21:**
  - 커버리지 탭 메뉴 트리 구조 변환
  - **개발 기간:** 25.08.19 - 25.08.20

- **2025-08-13:**
  - 커버리지 테이블 정렬 기능 추가
  - **개발 기간:** 2025-08-11 - 2025-08-12

---

<table>
  <thead>
    <tr>
      <th style="text-align: center">주간 대시보드</th>
      <th style="text-align: center">전주 대비 커버리지</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align: top;"><img src="/assets/img/tdd_bigbro/tdd_bigbro_4.png" alt="AS-IS" width="350px"></td>
      <td style="vertical-align: top;"><img src="/assets/img/tdd_bigbro/tdd_bigbro_5.png" alt="TO-BE" width="350px"></td>
    </tr>
  </tbody>
</table>

> **추신.** 
> 
> 초기 커버리지 화면은 `vitest/ui`를 본따서 구현했고, 이후 **준희** 님께서 SonarQube 대시보드처럼 UI를 개선하는 작업을 진행해주셨습니다.
>
> 본문에 명시된 기여도 60%는 이러한 협업 과정을 반영한 것입니다.
>
> 멋진 UI를 만들어주신 준희님께 다시 한번 감사를 전합니다.😊
{: .prompt-tip }