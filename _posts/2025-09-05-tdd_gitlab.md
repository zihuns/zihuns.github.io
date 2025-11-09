---
title: "TDD문화 도입 | (3) 커버리지 측정 및 자동화 시스템 구축 (GitLab + Vitest)"
contribution: 100
date: 2025-09-05 01:00:00 +0900
lastmod: 2025-09-23 22:52:53 +0900
start_date: 2025-08-07
end_date: 2025-08-26
categories: [Frontend, Test, CI/CD]
tags: [GitLab, CI/CD, Vitest, Coverage, Vue.js, Test]
excerpt: "GitLab CI/CD와 Vitest를 활용해 테스트 커버리지 자동화 및 관리 시스템을 구축한 과정과 시행착오를 정리합니다."
---

> 📌 이 글은 **TDD 시리즈** 중 3편입니다.  
> 1편: [Vitest 전환과 커버리지 기반 품질 관리](/posts/tdd_vitest)  
> 2편: [주간 커버리지 대시보드로 시각화하기](/posts/tdd_bigbro)  
> 4편: [Tech 발표, Vitest로 안정적인 프론트엔드 개발하기](/posts/tdd_ppt)

---

## 1. 도입 배경

- 프론트엔드 프로젝트에서 **테스트 자동화 및 커버리지 관리** 필요성 증가  
- MR(Merge Request) 시점에 **자동으로 커버리지를 측정**하고 팀원들이 직접 확인할 수 있는 체계 구축 요구  
- 코드 품질을 정량적으로 관리하고 리팩토링 안정성을 확보하기 위한 **자동화된 커버리지 관리 시스템** 도입  

---

## 2. GitLab CI/CD 파이프라인 구축

### 2.1 파이프라인 스테이지 설계
MR이 생성될 때마다 자동으로 테스트를 수행하고, 그 결과와 커버리지 리포트를 생성하여 업로드하도록 `test` 스테이지를 추가했습니다.

```yaml
stages:
  - test
  - build
```

- **test 스테이지**: MR 시 자동 테스트 및 커버리지 리포트 생성
- 업로드된 리포트를 GitLab UI와 연동해 품질 지표 확인
![테스트 스테이지](/assets/img/2025-01-25/tdd_gitlab_4.png)

### 2.2 Docker 기반 Node 환경
- GitLab Runner 기본 환경에는 Node.js 미설치 → `node` 명령어 실행 불가
- 해결책: **node:22 도커 이미지 pull 후 job 실행**
- Docker 환경에서 테스트 및 커버리지 리포트 안정적으로 수행

---

## 3. 테스트 커버리지 측정 자동화
### 3.1 Vitest 리포터 설정
- **Cobertura 리포터** → 상세 커버리지 분석
- **JUnit 리포터** → GitLab UI에서 테스트 결과 확인
- 다양한 리포트 생성으로 데이터 활용도 향상

### 3.2 GitLab CI 커버리지 설정
```yaml
test_coverage:
  stage: test
  script:
    - npm run test:coverage
    - cat coverage/coverage.txt
  coverage: '/All files\\s*\\|\\s*[0-9.]+\\s*\\|\\s*[0-9.]+\\s*\\|\\s*[0-9.]+\\s*\\|\\s*([0-9.]+)\\s*\\|/'
  artifacts:
    reports:
      junit: coverage/junit.xml
      cobertura: coverage/cobertura.xml
```
- **coverage badge**로 대시보드에서 상태 가시성 확보
- MR UI에서 커버리지 수치를 직접 확인 가능
![GitLab MR UI - 성공](/assets/img/2025-01-25/tdd_gitlab_1.png)
![GitLab MR UI - 실패](/assets/img/2025-01-25/tdd_gitlab_3.png)
- JUnit & Cobertura 리포트 → GitLab과 연동해 품질 메트릭 시각화
![JUnit 리포트](/assets/img/2025-01-25/tdd_gitlab_2.png)

---

## 4. 로컬 개발 환경 개선
### 4.1 Pre-commit Hook 설정
- 커밋 전에 자동으로 테스트 실행 (husky 사용)
- 실패 시 커밋 차단 → 품질 저하 방지

### 4.2 테스트 최적화
- Vitest 설정 업데이트
- 커버리지 측정 대상 명확화, 불필요한 파일 제외

---

## 5. 시스템 운영 및 모니터링
### 5.1 커버리지 데이터 수집
- **주간 단위 자동 수집**
- 장기적인 품질 트렌드 분석
- 취약 영역 조기 식별

### 5.2 리포팅 자동화
- GitLab MR에서 커버리지 변화 바로 확인
- 주간 단위 커버리지 리포트 자동 생성 및 팀 공유

---

## 6. 결과 및 개선 효과
### 6.1 개발 프로세스 향상
- MR 시점 자동 테스트 → 코드 품질 향상
- 테스트 작성 문화 정착
- 리팩토링 안정성 확보

### 6.2 운영 효율성 증대
- 수동 커버리지 보고서 작성 제거
- 일관된 품질 관리 체계 구축
- Slack 알림 연동으로 가시성 향상
![Slack 알림](/assets/img/2025-01-25/tdd_gitlab_5.png)
---

## 7. 시행착오
- **문제**: 전체 패키지 설치 후 테스트 실행 → 파이프라인 2분 이상 소요
- **임시 해결**: coverage.txt 기반 결과 수집
- **근본 문제**: 사용자별 커밋 차이로 .txt 충돌 발생
- **최종 해결**: Docker 기반으로 환경 통일 + CI artifact 활용

---

## 8. 향후 계획
- **커버리지 임계값 설정** → 기준치 미달 시 MR 자동 차단
- 테스트 실행 속도 최적화 (캐싱, selective test)
- 리포트 시각화 개선 및 Slack 알림 고도화
- 장기적으로 **자동화된 코드 품질 분석 & 테스트 전략 수립** 추진

---

## 9. 참고 자료

- [Gitlab - Code Coverage](https://docs.gitlab.com/ci/testing/code_coverage/)
- [Gitlab - Badges](https://docs.gitlab.com/user/project/badges/)
- [DockerHub - Node](https://hub.docker.com/_/node)