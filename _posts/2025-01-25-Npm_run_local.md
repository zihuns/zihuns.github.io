---
title: "[Node.js] 로컬 환경 자동화: CLI 기반 빌드 타겟 & URL 세팅"
contribution: 100%
date: 2025-09-19 13:00:00 +0900
categories: [Frontend, Node.js]
tags: [Node.js, CLI, inquirer, cheerio, 로컬환경자동화]
excerpt: "CLI에서 빌드 타겟 선택과 테스트 URL 크롤링을 통해 로컬 환경을 자동 세팅하는 과정을 정리했습니다."
---

# 🚀 로컬 환경에서 프로젝트 실행 자동화 개선기

## 1. 들어가며 (Motivation)
개인 개발 환경에서 프로젝트를 실행할 때마다  
- 빌드 타겟을 직접 지정해야 하고,  
- 테스트 매장 URL에 맞는 정보를 일일이 세팅해야 하는 불편함이 있었습니다.  

이를 자동화하면 로컬 개발 효율을 크게 올릴 수 있을 것 같아 개선 작업을 진행했습니다.

---

## 2. 요구사항 (Requirements)
1. **.env 파일의 빌드 타겟 추출**  
   - CLI를 통해 하위 페이지 목록 중 하나를 선택해 빌드할 수 있도록 구현  
2. **테스트 매장 URL 기반 정보 세팅**  
   - 사용자가 입력한 URL을 크롤링하여 필요한 데이터를 로컬 환경에 자동 반영  

---

## 3. 구현 (Implementation)

### 3.1 CLI 입력 처리
`inquirer` 패키지를 사용해 CLI에서 환경 타입과 테스트 URL을 입력받습니다.

```js
inquirer
  .prompt([
    {
      type: "list",
      name: "type",
      message: "사용할 개발 환경을 선택해 주세요.",
      choices: ["TEST", "STG", "PRD"]
    },
    {
      type: "input",
      name: "testURL",
      message: "테스트매장URL을 입력하세요:",
      validate: value => /^(ftp|http|https):\/\/[^ "]+$/.test(value) || "유효한 URL을 입력하세요."
    }
  ])
```

### 3.2 .env.localhost 업데이트

사용자가 선택한 옵션에 따라 환경 변수를 .env.localhost 파일에 반영합니다.
이미 존재하는 키는 덮어쓰고, 없으면 새로 추가하도록 작성했습니다.
```js
function readWriteSync(env = {}) {
  const data = fs.readFileSync(".env.localhost", "utf-8");
  let newValue = data;

  Object.keys(env).forEach(key => {
    if (data.includes(key)) {
      newValue = newValue.replace(new RegExp(`${key}=.*`, "gm"), `${key}=${env[key]}`);
    } else {
      newValue += `\n${key}=${env[key]}`;
    }
  });

  fs.writeFileSync(".env.localhost", newValue, "utf-8");
}
```

### 3.3 테스트 URL 크롤링

`axios + cheerio`를 활용해 HTML을 파싱하고, 페이지에 맞는 빌드 타겟을 추출합니다.

```js
async function setBuildTarget(testURL) {
  const response = await axios.get(testURL);
  const $ = cheerio.load(response.data);

  $("body script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src?.match(/main\.[a-f0-9]+\.js$/)) {
      const path = src.match(/\/p\/(.*?)\/assets/);
      if (path && path[1]) {
        buildTarget = `./src/pages/${path[1]}/main.js`;
        console.log("해당 페이지를 빌드합니다:", buildTarget);
      }
    }
  });
}
```
---

## 4. 결과 & 배운 점 (Result & Learning)

- ✅ CLI로 환경 타입과 URL을 입력하면, 로컬 환경이 자동 세팅되도록 개선했습니다.

- ✅ .env.localhost를 매번 수정할 필요가 없어졌습니다.

- ✅ 반복적인 환경 설정 작업을 줄여 개발 속도가 빨라졌습니다.

이번 작업을 통해 CLI 도구 제작 경험과 Node.js 기반 파일 입출력, 크롤링 로직 구현을 학습할 수 있었습니다.

---

## 5. 참고 자료 (References)

- [Inquirer.js 공식 문서](https://github.com/SBoudrias/Inquirer.js)

- [Cheerio 문서](https://cheerio.js.org/docs/intro)