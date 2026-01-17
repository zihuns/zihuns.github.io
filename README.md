<!-- markdownlint-disable-line -->
<div align="center">

  <!-- markdownlint-disable-line -->
  # zihun's blog

  FE개발자 서지훈의 망그러진 개발 블로그입니다.

  [![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)](https://zihuns.github.io)
  [![Jekyll](https://img.shields.io/badge/Jekyll-CC0000?style=flat-square&logo=jekyll&logoColor=white)](https://jekyllrb.com/)
  [![Chirpy Theme](https://img.shields.io/badge/Theme-Chirpy-CC6699?style=flat-square)](https://github.com/cotes2020/jekyll-theme-chirpy)
  [![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)][license]

  🌐 **Live Site**: [https://zihuns.github.io](https://zihuns.github.io)

</div>

## 📋 프로젝트 소개

이 프로젝트는 Jekyll 기반 정적 사이트 생성기와 Chirpy 테마를 사용하여 구축된 개인 개발 블로그입니다. 

프론트엔드 개발 과정에서 배운 내용, 프로젝트 경험, 기술 스택 등에 대한 글을 정리하고 공유하는 공간입니다.

## ✨ 주요 기능

- 🌓 다크/라이트 모드 지원
- 🇰🇷 한국어 UI 지원 (다국어 지원 가능)
- 📱 반응형 디자인
- 🔍 내장 검색 기능
- 📊 카테고리 및 태그 시스템
- 📝 코드 하이라이팅
- 📈 수학 표현식 및 Mermaid 다이어그램 지원
- 💬 댓글 시스템 (Disqus, Utterances, Giscus)
- 🔔 PWA 지원 (오프라인 캐싱)
- 📊 웹 분석 도구 연동
- ⚡ SEO 및 성능 최적화

## 📚 블로그 주요 주제

- **Git & GitLab CI**: Git 사용법, GitLab CI/CD 파이프라인 구축
- **Testing**: TDD 문화 도입, Vitest 전환, E2E 테스트
- **Frontend**: Node.js, Vue.js, MSW(Mock Service Worker)
- **DevOps**: CI/CD 자동화, 커버리지 측정 및 대시보드 구축

## 🛠 기술 스택

- **Static Site Generator**: Jekyll
- **Theme**: [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) v7.2.4
- **Language**: Ruby (Jekyll), JavaScript (Node.js)
- **Styling**: SCSS/Sass
- **Deployment**: GitHub Pages

## 🚀 로컬 개발 환경 설정

### 사전 요구사항

- Ruby (3.0.0 이상)
- Node.js (18.0.0 이상)
- Bundler
- npm

### 설치 및 실행

```bash
# Ruby 의존성 설치
bundle install

# Node.js 의존성 설치
npm install

# 로컬 서버 실행
bundle exec jekyll serve

# 또는 npm 스크립트 사용
npm start
```

서버 실행 후 `http://localhost:4000`에서 확인할 수 있습니다.

### 빌드

```bash
# CSS 및 JavaScript 빌드
npm run build

# Jekyll 빌드 (프로덕션)
JEKYLL_ENV=production bundle exec jekyll build
```

## 📁 프로젝트 구조

```
.
├── _config.yml          # Jekyll 사이트 설정
├── _posts/              # 블로그 포스트
├── _layouts/            # 레이아웃 템플릿
├── _includes/           # 재사용 가능한 컴포넌트
├── _sass/               # SCSS 스타일시트
├── _javascript/         # JavaScript 소스 코드
├── _data/               # 데이터 파일 (로케일, 메타데이터 등)
├── assets/              # 정적 리소스 (이미지, CSS, JS)
├── _tabs/               # 탭 페이지 (About, Archives 등)
└── _site/               # 빌드 결과물 (자동 생성)
```

## 📝 새 포스트 작성

1. `_posts/` 디렉토리에 `YYYY-MM-DD-post-title.md` 형식으로 파일 생성
2. Front Matter에 메타데이터 작성:

```yaml
---
title: "포스트 제목"
date: 2025-01-01 00:00:00 +0900
categories: [카테고리1, 카테고리2]
tags: [태그1, 태그2]
---
```

3. Markdown으로 콘텐츠 작성

## 🔗 관련 링크

- **블로그**: [https://zihuns.github.io](https://zihuns.github.io)
- **GitHub**: [https://github.com/zihuns](https://github.com/zihuns)
- **LinkedIn**: [https://www.linkedin.com/in/zihuns](https://www.linkedin.com/in/zihuns)

## 📄 라이선스

이 프로젝트는 [MIT License][license]를 따릅니다.

## 🙏 크레딧

이 블로그는 [Chirpy Jekyll Theme](https://github.com/cotes2020/jekyll-theme-chirpy)를 기반으로 합니다.

---

<div align="center">

**Made with ❤️ by zihuns**

</div>

[license]: https://github.com/zihuns/zihuns.github.io/blob/main/LICENSE
