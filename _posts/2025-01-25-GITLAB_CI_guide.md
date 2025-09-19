---
title: GITLAB CI & SLACK WEBHOOK(2024) - 가이드
contribution : 100%
date: 2025-01-25 01:00:00 +09:00
categories: [Frontend, GITLAB-CI/CD]
tags: [gitlab, slack, bash]
---

# 1. 기능

## **1-1. SLACK INCOMING WEBHOOK**

- mr_machine은 slack incoming webhook을 담당하는 job이고, 사용자가 MR을 생성하면 자동으로 수행되는 부분으로
- send_slack_message(), mr_message() 함수와 그 외의 스크립트로 구성되어있습니다.
- 기능은 크게 4가지로 이루어져있습니다.
1. 
    1. 대상그룹 호출 기능(@here, @fsd_display, @fsd_search)
    2. Slack Incoming Webhook 비활성화
    3. MR 충돌 감지
    4. Slack Incoming Webhook을 통한 슬렉 메시지 전송

## **1-2. AUTO MR**

- create_MR은 MR 생성을 담당하는 job이고, 사용자가 labels에서 MR을 선택하면 자동으로 MR을 생성하는 부분으로
- 기능은 크게 2가지로 이루어져있습니다.
    1. Slack Incoming Webhook 비활성화
    2. 자동 MR 생성

# 2. 사용법

다른 기능들은 사용자의 별다른 조작 없이 자동으로 수행되는 부분이므로, 아래 3가지 기능에 대한 사용법을 기술하도록 하겠습니다.

1. 대상그룹 호출 기능(@here, @fsd_display, @fsd_search)
2. Slack Incoming Webhook 비활성화
3. 자동 MR 생성

## **2-1. 대상그룹 호출 기능(@here, @fsd_display, @fsd_search)**

- ****해당 기능은 MR 생성 시 labels를 이용하는 기능으로, 원하는 대상에 해당하는 label을 선택하면 슬렉 메시지에서 해당 그룹을 호출하게 됩니다.

![image.png](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_1.png)

![image.png](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_2.png)

## **2-2. Slack Incoming Webhook 비활성화**

- 해당 기능은 MR 생성 시 슬렉으로 메시지 전송하는 것을 비활성화하는 기능으로, Draft: 를 선택하면 메시지 전송이 비활성화 됩니다.
- 활성화 하고싶은 경우 Mark as ready 버튼을 누르고 Pipelines탭에서 Run pipeline 하면 됩니다.

![image.png](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_3.png)

![image.png](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_4.png)

## **2-3. 자동 MR 생성**

- 해당 기능은 MR 생성 시 labels를 이용하는 기능으로, 자동 MR 생성을 원할 시, labels에서 MR을 선택하면 MR이 생성됩니다.
- case 1. source → develop MR을 만들 경우, 가장 최신 release 브랜치를 탐색해서 MR을 추가로 생성하고,
- case 2. source → release MR을 만들 경우, develop 브랜치를 target으로 MR을 추가로 생성합니다.

# 3. 코드해석

```jsx
#외부참조 부분 // .gitlab-ci.yml
include:
  - project: ""
    ref: master
    file: ""

# 내부 프로세스
variables:
    TB: ${CI_MERGE_REQUEST_TARGET_BRANCH_NAME}
    SB: ${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}
    MR_URL: ${CI_MERGE_REQUEST_PROJECT_URL}/-/merge_requests/${CI_MERGE_REQUEST_IID}
    CHN: channel

before_script:
    - |
      PROFILE="${GITLAB_USER_NAME%%(*}"

# AUTO MR JOB
create_MR:
  stage: build

  script: |
    if [[ "$CI_MERGE_REQUEST_LABELS" != *"MR"* ]] ; then
      exit 0;
    fi

    DRAFT=""
    [[ "$CI_MERGE_REQUEST_TITLE" == Draft:* ]] && DRAFT="Draft: "

    if [ ${TB} == "develop" ] ; then
      git fetch
      TARGET_BRANCH=$(git branch -r | grep -E 'release-[0-9]{6}-1|release/[0-9]{6}' | sort -r | head -n 1 | cut -d'/' -f2)
    elif [ ${TB:0:7} == "release" ] ; then
      TARGET_BRANCH="develop"
    fi

    # GitLab API 호스트 설정
    HOST=""

    # 사용자 정보 설정
    USER_NAME=$(echo ${GITLAB_USER_EMAIL%%@*} | tr -d "." | tr '[:lower:]' '[:upper:]')
    PRIVATE_TOKEN=$(eval echo \${${USER_NAME}_COMMIT_TOKEN})

    BODY="{
      \"project_id\": ${CI_PROJECT_ID},
      \"source_branch\": \"${CI_COMMIT_REF_NAME}\",
      \"target_branch\": \"${TARGET_BRANCH}\",
      \"description\" : \" ##### 티켓명: ${CI_COMMIT_REF_NAME}\n ##### 수정 내용(상세)\n ${CI_COMMIT_MESSAGE} \",
      \"title\" : \" ${DRAFT} ${CI_COMMIT_TITLE}\",
      \"labels\" : \" "$CI_MERGE_REQUEST_LABELS"\"
    }";

    curl -X POST "${HOST}${CI_PROJECT_ID}/merge_requests" \
    --header "PRIVATE-TOKEN:${PRIVATE_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "${BODY}";
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

# SLACK INCOMING WEBHOOK JOB
mr_machine:
  stage: build

  script: |
    send_slack_message() {
      username="$1"
      text="$2"
      icon_emoji="$3"
      curl -X POST -H "Content-type: application/json" --data "{\"channel\": \"#${CHN}\", \"username\": \"${username}\", \"text\":\"${text}\", \"icon_emoji\": \":${icon_emoji}:\" }" $SLACK_URL
    }

    mr_message() {
      text="$1"
      txt="${ALARM}\n :gitlab: ${text} MR 리뷰 & 승인 부탁드립니다! \n:branch: ${SB} → ${TB} ( <${MR_URL}|MR 링크 - ${CI_PROJECT_NAME}> )"
      send_slack_message "${GITLAB_USER_NAME}" "$txt" "${PROFILE}"
    }

    # @here
    case "$CI_MERGE_REQUEST_LABELS" in
      *here*) ALARM="<!here>" ;;
      *display*) ALARM="<!subteam^S071TKD5D43>" ;;
      *search*) ALARM="<!subteam^S071M46C822>" ;;
    esac

    # Draft:
    if [[ "$CI_MERGE_REQUEST_TITLE" == Draft:* ]] ; then
      exit 0;
    elif [ ${TB} != "master" ] || [ ${SB:0:7} != "feature" ] ; then
      git config --global --replace-all user.email "${GITLAB_USER_EMAIL}"
      git config --global --replace-all user.name "${GITLAB_USER_NAME}"

      git fetch origin ${SB}
      git fetch origin ${TB}
      git checkout origin/${SB}
      git merge origin/${TB}
    fi

    if [ ${TB} == "develop" ] ; then  # dev MR
      mr_message "dev"
    elif [ ${TB:0:7} == "release" ] ; then  # release MR
      mr_message "release"
    elif [ ${TB} == "master" ] && [ ${SB:0:6} == "hotfix" ] ; then   # hotfix MR
      mr_message ":fire-:HOTFIX:fire-:"
    elif [ ${TB} == "master" ] && [ ${SB:0:7} != "release" ] ; then   # Except release -> master MR
      send_slack_message "마스터수호자" "<!here> \n :crossed_swords: master merge 발견 :crossed_swords: \n :${PROFILE}: ${GITLAB_USER_NAME} \n :gitlab: ${SB} -> ${TB} ( <${MR_URL}|MR 링크 - ${CI_PROJECT_NAME}> )" "judge"
      echo "Master MR FAIL" > .job_status
      exit 93;
    fi

# 충돌 발생시 SLACK 메시지 전송
  after_script:
  - |
    if [ !$(cat .job_status) ] && [ ${CI_JOB_STATUS} == "failed" ] ; then
      curl -X POST -H "Content-type: application/json" --data "{\"channel\": \"#channel\", \"username\": \"${GITLAB_USER_NAME}\", \"text\":\" :branch: 충돌 발생 :broken_branch:\n:폭발: ${SB} → ${TB} ( <${MR_URL}|MR 링크 - ${CI_PROJECT_NAME}> ) \", \"icon_emoji\": \":${GITLAB_USER_NAME%%(*}:\" }" $SLACK_URL
    fi

  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

---

MR 생성 시 수행되는 JOB은 create_MR과 mr_machine 2개입니다.

- create_MR(line 19 ~ 58)
    - line 23 ~ 25
        - label 중 MR이 포함되어 있는지 확인하고 없을 경우 job을 마칩니다.
    - line 27 ~ 28
        - MR 제목이 Draft: 로 시작하면 변수 DRAFT에 "Draft: "를 할당합니다.
    - line 30 ~ 35
        - target 브랜치가 develop인 경우 원격 브랜치 중 가장 최신 날짜의 release 브랜치를 검색해서 변수 TARGET_BRANCH에 "release브랜치명"을 할당합니다.
        - target 브랜치가 release인 경우 변수 TARGET_BRANCH에 "develop"을 할당합니다.
    - line 37 ~ 56
        - USER_NAME에 해당하는 커밋 토큰이 프로젝트 변수에 설정되어 있는 경우 MR을 생성합니다. ([jihun.seo@lotte.net](mailto:jihun.seo@lotte.net)일 경우, JIHUN.SEO_COMMIT_TOKEN 값이 미리 설정되어야함)
- mr_machine(line 61 ~ 108)
    - line 65 ~ 70
        - 3개의 argument를 전달 받아 slack으로 메시지를 보냅니다.
    - line 72 ~ 76
        - develop, release MR의 경우, 형식이 유사하므로 브랜치 이름만 전달 받아 send_slack_message를 실행합니다.
    - line 79 ~ 83
        - label을 확인하고 케이스에 해당하는 그룹을 변수 ALARM에 할당합니다.
    - line 86 ~ 96
        - MR 제목이 Draft: 로 시작하면 정상 종료합니다.
        - 그 외의 경우 원격 소스브랜치와 타겟브랜치를 머지해서 충돌날 경우 비정상 종료합니다. → 충돌 알림
    - line 98 ~ 108
        - master 브랜치일 경우 send_slack_message를 실행하고 그 외의 경우 mr_message를 실행합니다.