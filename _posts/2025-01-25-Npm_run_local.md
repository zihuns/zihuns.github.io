---
title: npm run local(2023)
date: 2025-01-25 01:00:00 +09:00
categories: [Fronte-End]
tags: [Node.js, npm, Webpack]
---

**1. 목적 :** 로컬(개인 개발PC)에서 프로젝트 실행을 보다 쉽게 하기 위해 개선

**2. 요건**

- .env 파일의 빌드 타겟을 이용해서 하위 페이지 목록 추출 후 빌드 페이지를 cli에서 선택할 수 있는 기능 개발
- 테스트매장URL을 입력하면 해당 주소의 정보를 크롤링하여 로컬환경에 정보세팅

```jsx
const inquirer = require("inquirer");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

// 환경 변수 파일 읽기
const data = fs.readFileSync(".env", "utf8");
const lines = data.split("\n");

let existBuildTarget = "";
let buildTarget = "";
let html = "";

// 기존 빌드 타겟 찾기
lines.filter(currentLine => {
  if (currentLine.includes("VUE_TARGET_PAGE") && !currentLine.includes("#")) {
    existBuildTarget = currentLine.split("=")[1].trim();
  }
});

// 사용자 입력 받기
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
      validate: value => {
        const valid = /^(ftp|http|https):\/\/[^ "]+$/.test(value);
        return valid || "유효한 URL을 입력하세요.";
      }
    }
  ])
  .then(async ({ type, testURL }) => {
    const prefix = getDevEnvironmentPrefix(type);
    const isFashion = await setBuildTarget(testURL);

    setIndexHTML();

    // 환경 변수 객체 생성
    const env = {
      STATIC_URL: `https://${prefix}static.com/m`,
      LOCAL_OPEN_URL_SUFFIX: getOpenUrlSuffix(buildTarget, testURL),
      VUE_APP_PREFIX: prefix,
      VUE_APP_CLI: "true",
      VUE_APP_BFF_URL: `https://${prefix}pbf.com`,
      VUE_TARGET_PAGE: buildTarget || existBuildTarget
    };

    readWriteSync(env);
  });

// 환경 변수를 파일에 읽고 쓰기
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

// 빌드 타겟 설정
async function setBuildTarget(testURL) {
  let isFashion = false;
  testURL = testURL.includes("/m/") ? testURL : testURL.replace("/p/", "/m/");

  try {
    const response = await axios.get(testURL);
    if (response.status === 200) {
      html = response.data;
      const $ = cheerio.load(html);

      $("body script[src]").each((index, element) => {
        const src = $(element).attr("src");

        if (src && src.match(/main\.[a-f0-9]+\.js$/)) {
          const path = src.match(/\/p\/(.*?)\/assets/);

          if (path && path[1]) {
            isFashion = path[1].includes("fashion");
            buildTarget = `./src/pages/${path[1]}/main.js`;
            console.log("해당 페이지를 빌드합니다: ", buildTarget);
          }
        }
      });
    }
  } catch (error) {
    console.error(`Error fetching the page: ${error}`);
  }
  return isFashion;
}

// index.html 파일 설정
function setIndexHTML() {
  const indexHTMLPath = "cli/assets/local.index.html";
  let fileContent = fs.readFileSync(indexHTMLPath, "utf-8");
  const $ = cheerio.load(html);
  const inputValues = {};

  $('input[type="hidden"]').each((index, element) => {
    const tagName = element.tagName;
    const id = $(element).attr("id");
    const name = $(element).attr("name");
    let value = $(element).val();

    // 특정 ID에 대한 값 변경
    if (id === "FullUrl" || id === "LiteUrl") {
      value = value.includes("PC") ? value.replace("PC", "MW") : value;
    }

    inputValues[id] = value;

    // 파일 내용 업데이트
    const pattern = new RegExp(`<input\\s+type="hidden"\\s+id="${id}"[^>]* \\/>`, "g");
    const replacement = `<${tagName} type="hidden" id="${id}" name="${name}" value='${value}' />`;
    fileContent = fileContent.replace(pattern, replacement);
  });

  console.log("input 태그값: ", inputValues);
  fs.writeFileSync(indexHTMLPath, fileContent);
}

// 개발 환경 접두사 반환
function getDevEnvironmentPrefix(type = "TEST") {
  return type === "PRD" ? "" : `${String(type).toLowerCase()}-`;
}

// URL 접미사 생성
function getOpenUrlSuffix(buildTarget = "", testURL = "") {
  const shopNo = testURL ? testURL.split("/").pop() : -1;
  const isNumeric = /^\d+$/.test(shopNo);

  if (!buildTarget || shopNo < 0 || !isNumeric) return "";
  if (["/main/**"].some(page => buildTarget.includes(page))) return `?shopNo=${shopNo}`;
  return `/${shopNo}`;
}
```