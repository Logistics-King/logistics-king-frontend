# 커밋 작성 규칙

## 목표

작업을 기능 단위로 나눠 커밋하고, 커밋 메시지는 변경 성격과 이슈 번호가 바로 보이게 작성한다.

## 메시지 형식

```text
<prefix> : #<issue-number> <수정 내용>
```

예시:

```text
feat : #1 유저 도메인 생성
feat : #1 엔드포인트 권한 설정
chore : #1 Redis 및 JWT 설정 추가
refactor : #1 인증 구조 분리
fix : #1 토큰 재발급 검증 로직 수정
hotfix : #1 인증 필터 긴급 수정
```

## Prefix 기준

- `feat`: 신규 개발
- `fix`: 기존 로직 수정
- `refactor`: 동작 변화 없이 구조만 수정
- `hotfix`: 긴급 오류 수정
- `chore`: 동작 변화 없는 설정, 문서, 빌드 변경

## 작성 규칙

- prefix 뒤에는 공백, 콜론, 공백을 둔다.
- 이슈 번호는 `#1`처럼 작성한다.
- 메시지는 한국어로 간결하게 작성한다.
- 한 커밋에는 하나의 큰 의도만 담는다.
- 여러 파일이 바뀌었어도 같은 의도면 한 커밋으로 묶는다.
- 설정 변경과 기능 구현은 가능하면 분리한다.
- 테스트 수정은 기능과 직접 연결되어 있으면 같은 커밋에 포함해도 된다.

## 큰 diff 분리 규칙

diff가 큰 경우 파일 단위보다 사용자가 남긴 요구사항과 구현 의도 기준으로 나눠 커밋한다.

커밋 분리 순서:

1. 사용자가 요청한 요구사항 문장을 먼저 확인한다.
2. 요구사항을 기능/설정/구조/수정 단위로 나눈다.
3. 각 단위에 맞는 prefix를 고른다.
4. 해당 단위에 필요한 파일만 stage한다.
5. 같은 파일 안에 여러 의도가 섞여 있으면 가능한 한 hunk 단위로 stage한다.
6. 각 커밋이 단독으로 설명 가능한지 확인한다.

분리 기준:

- 도메인 모델 추가는 `feat`
- API 추가는 `feat`
- 인증/권한 필터 추가는 `feat`
- build.gradle, application.yml, SQL 경로, 문서 설정은 `chore`
- 이름 변경, 패키지 이동, 구조 정리만 있으면 `refactor`
- 동작 버그 수정이면 `fix`
- 운영 장애나 긴급 수정이면 `hotfix`

큰 diff에서 피할 것:

- "작업 내용 정리"처럼 너무 큰 커밋
- 설정 변경과 기능 구현을 한 커밋에 섞기
- 테스트만 실패해서 맞춘 로직 수정과 신규 기능을 무조건 한 커밋에 묶기
- 사용자가 요청한 여러 요구사항을 하나의 `feat` 커밋에 모두 넣기

커밋 전 분리 예시:

```text
요구사항: User PK는 UUIDv7
커밋: feat : #1 시간순 UUID 생성기 추가

요구사항: MySQL yml 설정과 SQL 경로 관리
커밋: chore : #1 MySQL 및 SQL 관리 설정 추가

요구사항: UserJpaEntity와 domain 분리
커밋: feat : #1 유저 도메인과 JPA 엔티티 분리

요구사항: end_points 권한 테이블
커밋: feat : #1 엔드포인트 권한 테이블 추가

요구사항: JWT/Redis 인증
커밋: feat : #1 JWT Redis 인증 구조 추가
```

stage 확인 명령:

```bash
git diff --cached --stat
git diff --cached --name-only
```

커밋 직전에는 staged diff가 커밋 메시지 한 줄로 설명되는지 확인한다.

## 현재 작업 커밋 분리 후보

현재 권한/User 작업은 다음처럼 나누는 것을 우선한다.

```text
chore : #1 AI 작업 규칙 문서 추가
chore : #1 MySQL 및 SQL 관리 설정 추가
feat : #1 유저 도메인 생성
feat : #1 시간순 UUID 생성기 추가
feat : #1 엔드포인트 권한 도메인 생성
feat : #1 JWT Redis 인증 구조 추가
feat : #1 인증 API 추가
```

세부 diff가 크면 더 쪼갠다. 예를 들어 security filter, token provider, auth API는 각각 별도 `feat` 커밋으로 나눌 수 있다.

## 커밋 전 확인

가능하면 커밋 전 아래 명령을 실행한다.

```bash
./gradlew test
```

테스트를 못 돌렸으면 커밋 메시지는 그대로 쓰되, PR이나 작업 요약에 못 돌린 이유를 남긴다.
