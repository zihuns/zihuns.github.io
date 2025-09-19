---
title: GITLAB CI & SLACK WEBHOOK(2024) - 가이드
contribution : 100%
date: 2025-01-25 01:00:00 +09:00
categories: [Frontend, GITLAB-CI/CD]
tags: [gitlab, slack, bash]
---


## 1. 주요 기능 요약

### Slack Incoming Webhook (mr_machine job)
- MR 생성 시 자동으로 슬랙 메시지 전송
- 대상 그룹 호출(@here, @fsd_display, @fsd_search)
- Draft: 제목으로 알림 비활성화
- MR 충돌 감지 및 알림

---

## 2. 사용법

### 2-1. MR 알림 on/off 설정
MR 생성 시 기본적으로 슬랙 알림이 전송됩니다. 알림을 비활성화하려면 MR 제목을 `Draft:`로 시작하세요.
다시 활성화하려면 Mark as ready를 클릭하거나, 커밋 추가/파이프라인 실행을 하면 됩니다. (우측 상단 점 3개 [ ⋮ ] 메뉴에서 Draft/Ready 토글 가능)

![MR 알림 on/off](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_4_1.png)
![MR 알림 Draft 예시](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_4_2.png)
![MR 알림 Ready 예시](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_4_3.png)

### 2-2. 대상 그룹 호출
MR 생성 시 labels에서 @here, @fsd_display, @fsd_search 등 원하는 그룹을 선택하면 해당 그룹이 슬랙 메시지에서 호출됩니다.
![대상 그룹 호출 예시1](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_1.png)
![대상 그룹 호출 예시2](/assets/img/2025-01-25/2025-01-25-GITLAB_CI_guide_2.png)

### 2-3. 자동 MR 생성
labels에서 MR을 선택하면 자동으로 MR이 생성됩니다.


## 3. 자주 발생하는 문제와 해결법

---

## 참고 이미지

위 이미지는 MR 알림 on/off 및 Draft/Ready 상태에서의 실제 화면 예시입니다.

1. **slack 알림이 오지 않음**  
→ SLACK_URL 변수가 누락된 경우입니다. Settings > CI/CD > Variables에서 SLACK_URL을 등록하세요.

2. **프로필 사진 대신 글자만 나옴**  
→ GitLab 사용자 이름을 규칙에 맞게 변경하거나, Slack에 해당 이모지를 추가하세요.

3. **프리징 기간에 긴급 배포 필요**  
→ Settings > CI/CD > Variables에서 프리징 기간 변수(F_S_DATE, F_E_DATE)를 임시로 변경 후, 배포가 끝나면 원래 값으로 복구하세요.

---

## 4. 주요 코드 및 해설

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

MR 생성 시 수행되는 JOB은 mr_machine 1개입니다.

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