---
title: "[Node.js] LTS 업그레이드 | 1. nvm 순차 전환과 Sass 로더 호환성 정리"
contribution: 100
date: 2023-09-10 01:00:00 +0900
lastmod: 2025-09-21 14:30:00 +0900
start_date: 2023-07-13
end_date: 2023-09-07
categories: [Frontend, Node.js]
tags: [Node.js, npm, nvm, webpack, sass-loader, Dart Sass]
excerpt: "Node 10.16.3에서 LTS 기준(v10→v12→v14→v16)으로 업그레이드하며 node-sass·sass-loader 호환 이슈를 해결하고 Dart Sass 전환까지 정리했습니다."
---

> 📌 이 글은 **LTS 업그레이드** 중 1편입니다.  
> 2편: [nvm 순차 전환과 Dart Sass 전환](/posts/nodejs_version_2)  

---

## 1. 들어가며 (Motivation)

레거시 환경(Node 10.16.3)에서 모듈 설치 오류·보안 리스크를 줄이고 유지보수성을 높이기 위해 LTS 단위로 순차 업그레이드를 진행했습니다.  
업무 환경에 영향이 없도록 별도 작업 디렉터리에 프로젝트를 클론해 단계별 빌드·서브 동작을 검증했습니다.

---

## 2. 요구사항 (Requirements)

1. **nvm으로 LTS 버전(v10→v12→v14→v16) 순차 전환 및 각 단계 검증**
2. **매 단계 클린 설치 후 실행 테스트 루틴 확립**  
   - `rm -rf node_modules`  
   - `npm i` 또는 `npm ci`  
   - `npm run build`/`serve`
3. **node-sass·sass-loader·webpack 조합의 호환성 이슈 식별과 해결책 도출**

---

## 3. 주요 이슈와 해결 (Troubleshooting)

### 3.1 Node & node-sass & 버전 호환 이슈

기존 환경설정에서 별다른 변화 없이 Node v14.21.3까지는 정상적으로 업그레이드가 가능했습니다.  
하지만 v16.20.1부터는 node-sass 모듈과 Node 버전의 호환 이슈가 발생했습니다.

- node-sass 6버전 설치를 시도했으나, vue와 webpack 버전 이슈로 인해 다음과 같이 조치했습니다.

```bash
npm uninstall webpack
npm i --save-dev webpack@4 # v4.46.0으로 고정
npm uninstall node-sass
npm i --save-dev node-sass@6
```

이후 다시 빌드를 진행했습니다.

### 3.2 node-sass & sass-loader 버전 호환

node-sass 설치 후 빌드 시 아래와 같은 에러가 발생했습니다.

```
Node Sass version 6.0.1 is incompatible with ^4.0.0 || ^5.0.0.
```

이는 node-sass와 sass-loader 버전 호환 문제입니다.  
node-sass 버전을 낮추는 방법도 있지만, 이는 Node 및 의존성 모듈의 업그레이드 취지에 맞지 않아  
**sass-loader 버전을 업그레이드**하는 방향으로 결정했습니다.

- 여러 버전을 테스트한 결과, `sass-loader@10.4.1`이 node-sass 6.x와 호환됨을 확인했습니다.

```bash
npm i --save-dev sass-loader@10.4.1
```

### 3.3 sass-loader 버전 변경에 따른 옵션 변화

- v8: `data` → `prependData`
- v9+: `prependData` → `additionalData`

전역 SASS 주입은 `additionalData`로 통일합니다.

---

## 4. 결과 & 배운 점 (Result & Learning)


### as-is

```json
"devDependencies": {
  "node-sass": "^4.9.0",
  "sass-loader": "^7.1.0",
  "webpack": "^4.41.2"
}
```

### to-be

```json
"devDependencies": {
  "node-sass": "^6.0.1",
  "sass-loader": "^10.4.1",
  "webpack": "4.46.0"
}
```

- Node 14.21.x까지는 큰 수정 없이 통과, Node 16.x에서는 node-sass 6.x 조정으로 안정화했습니다.
- LTS 단계마다 동일한 검증 루틴을 적용해 회귀 이슈를 조기 발견했습니다.
- sass-loader 옵션 변천을 정리해 설정 혼선을 줄였고, 장기적으로 빌드 체인 업데이트(webpack, vue-loader, sass-loader)가 필요함을 확인했습니다.

---

## 5. 기술 스택 (Tech Stack)

`Node.js` `nvm` `node-sass` `sass-loader` `webpack` `npm`

---

## 6. 참고 자료 (References)

- [node-sass (npm)](https://www.npmjs.com/package/node-sass#node-version-support-policy)