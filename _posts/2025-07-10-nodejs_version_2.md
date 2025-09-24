---
title: "[Node.js] LTS 업그레이드 | (2) 16 → 22 업그레이드 과정과 마이그레이션 이슈 정리"
contribution: 100
date: 2025-07-10 01:00:00 +0900
lastmod: 2025-09-21 14:30:00 +0900
start_date: 2025-06-23
end_date: 2025-07-08
categories: [Frontend, Node.js]
tags: [Node.js, webpack, vite, sass, Vue]
excerpt: "Node.js LTS 16에서 22로 업그레이드하면서 겪은 빌드 환경별 이슈와 해결 과정을 정리했습니다. vite 번들러는 무난했지만, webpack@4 기반 프로젝트에서는 OpenSSL, node-sass 관련 문제가 있었습니다."
---

> 📌 이 글은 **LTS 업그레이드** 중 2편입니다.  
> 1편: [nvm 순차 전환과 Sass 로더 호환성 정리](/posts/nodejs_version)  

---

## 1. 들어가며

최근 프로젝트 환경을 **Node.js LTS 16 → 22**로 업그레이드했습니다.  
일부 서비스는 vite를 사용하고 있어 큰 문제가 없었지만, webpack@4 기반 서비스에서는 예상치 못한 이슈들이 발생했습니다.  

이번 글에서는 실제 마이그레이션 과정에서 마주한 문제들과 그 해결 과정을 기록합니다.

---

## 2. 번들러별 차이

### 2.1 vite 기반 프로젝트
- **대상:** `fo-display-pc-ui`, `fo-display-mo-ui`  
- **상황:** vite는 Node.js 최신 버전에 잘 대응하고 있었기 때문에, 특별한 이슈 없이 빌드 및 실행이 가능했습니다.  

👉 별도 수정 없이 `npm install` 후 바로 정상 동작.

---

### 2.2 webpack@4 기반 프로젝트
- **대상:** `fo-common-pc-ui`, `fo-common-mo-ui`  
- **상황:** Node.js 22 환경에서 빌드 시 `OpenSSL` 관련 오류 발생.  
- webpack 4는 오래된 Node.js 버전 기준으로 작성된 의존성이 많아, 최신 LTS와 충돌했습니다.  

#### 대표 에러 메시지
> Error: Unsupported PKCS12 PFX data

![warning.png](/assets/img/2025-01-25/nodejs_version_2_1.png)

이 문제는 `--openssl-legacy-provider` 플래그를 붙여 해결할 수 있었지만, 근본적으로는 **webpack 5 업그레이드**가 필요합니다.  

---

## 3. webpack 5 업그레이드를 못 한 이유

webpack 5로 넘어가려면 단순히 webpack 버전만 올리면 되는 게 아니었습니다.  
현재 프로젝트는 **Vue 2 기반**인데, vue-loader 등 주요 로더들이 Vue 3를 기준으로 webpack 5를 지원하고 있습니다.  

즉,  
- webpack 4 → 5 마이그레이션  
- 동시에 Vue 2 → 3 전환  

두 가지가 묶여 있어야 합니다.  

Vue 3 마이그레이션은 규모가 크고, 기존 레거시 코드와의 호환성 문제까지 검토해야 하므로 이번 Node.js 업그레이드 범위에서는 적용하지 못했습니다.  

👉 따라서 **단기적으로는 OpenSSL Legacy Provider 옵션을 활용**하여 빌드 환경을 유지하는 선에서 마무리했습니다.

---

## 4. node-sass → dart-sass 전환

Node.js 22에서 `node-sass`는 더 이상 빌드가 원활하지 않았습니다.  
(내부적으로 사용하던 binding이 최신 Node 버전을 지원하지 않음)

따라서 `dart-sass`로 전환했습니다:

```bash
npm uninstall node-sass
npm install sass --save-dev
```

- **node-sass** → C++ 기반 바인딩, Node.js 버전 호환성 문제가 잦음

- **dart-sass** → JS 기반, Node.js 최신 버전에서도 안정적으로 동작

기존의 sass-loader 설정에서 특별히 바꿀 필요는 없었고, 단순히 node-sass 대신 sass 패키지를 사용하도록만 수정했습니다.

`package.json`에서는 다음과 같이 의존성이 변경됩니다.

```diff
- "node-sass": "^6.0.1",
+ "sass": "^1.89.2",
```

<br/>

### 4.1 Sass 마이그레이션 이슈

`dart-sass`로 전환하는 과정에서 몇 가지 추가적인 수정이 필요했습니다.

#### 1) `@import` 대신 `@use` 사용

빌드 시 아래와 같은 경고가 발생했습니다. 이는 `dart-sass`가 모듈 시스템을 `@import`에서 `@use`와 `@forward`로 변경했기 때문입니다.

!Sass @import 경고

> **Deprecation [legacy-js-api]: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.**
> 
> **Deprecation [import]: Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.**

![warning.png](/assets/img/2025-01-25/nodejs_version_2_2.png)

`@import`는 전역적으로 스타일을 불러와 변수나 믹스인 충돌의 위험이 있었지만, `@use`는 모듈별로 네임스페이스를 가지므로 더 안정적입니다.

```scss
// AS-IS
@import 'variables';

// TO-BE
@use 'variables' as *; // 변수를 전역처럼 사용
```

#### 2) `/deep/` 선택자 변경

Vue에서 컴포넌트의 스코프 스타일을 뚫고 하위 컴포넌트에 스타일을 적용하기 위해 사용하던 `/deep/` (또는 `>>>`) 선택자는 `::v-deep`으로 변경해야 합니다.

```scss
// AS-IS
/deep/ .child-component {
  color: red;
}

// TO-BE
::v-deep .child-component {
  color: red;
}
```

#### 3) `@extend` 문법 오류

`@extend` 규칙에서 복합 선택자(placeholder와 변수 결합)를 사용하는 문법이 더 이상 지원되지 않아 오류가 발생했습니다.

```scss
// AS-IS: 에러 발생
$icon: &;
@extend #{$icon};

// TO-BE: 정적 선택자로 변경
@extend .icon;
```

이러한 변경사항들을 적용하여 `dart-sass` 환경에 맞게 코드를 수정했습니다.

---

## 5. 정리 (Result & Learning)

- **vite 기반 서비스** : 문제 없이 Node.js 22 대응

- **webpack 4 기반 서비스** : OpenSSL 관련 에러 → --openssl-legacy-provider 옵션으로 임시 대응

- **sass 전환** : node-sass → dart-sass로 교체하여 Node.js 22 지원 확보

- **webpack 5 업그레이드 보류** : Vue 2 → 3 마이그레이션 필요성 때문에 당장은 적용하지 못함

👉 이번 경험으로, 장기적으로 Vue 3 + webpack 5 이상 업그레이드가 필요하다는 점을 다시 확인했습니다.
또한, node-sass는 더 이상 유지보수 대상이 아니므로 dart-sass로 전환하는 것이 필수적입니다.

---

## 6. 참고 자료

- [Stackoverflow - OpenSSL Legacy Provider](https://stackoverflow.com/questions/69962209/what-is-openssl-legacy-provider-in-node-js-v17)
- [Sass 공식 문서](https://sass-lang.com/documentation/)

---

## 🗓️ 업데이트 내역

- **2025-08-26:**  
  - 라이브러리 및 스크립트 정리, 빌드 크기 1.20% 감소 (25.1MB → 24.8MB)
  - **개발 기간:** 25.08.18 - 25.08.26

---