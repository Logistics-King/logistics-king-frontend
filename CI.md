# 프론트 CI와 수동 배포

## 실행 조건

- develop/main push(머지 또는 직접 push)에만 CI를 실행한다. 기능 브랜치 push와 PR 생성/업데이트에서는 실행하지 않는다.
- 실행 순서: npm ci → lint → Next.js route type 생성 → TypeScript 검사 → production build → Docker build.
- develop/main push: 같은 검증을 통과한 뒤 GHCR에 `ghcr.io/<소문자 owner>/<소문자 repository>:sha-<전체 commit SHA>`를 업로드한다.
- 테스트 프레임워크가 아직 없어 자동 단위 테스트와 브라우저 검증은 이 CI에 포함되지 않는다. lint/type/build 성공은 실제 API 연동 성공을 의미하지 않는다.
- SSH 접속, 서버 재시작, DB 변경, 자동 배포는 수행하지 않는다.

## GitHub 설정

- Actions 실행 및 해당 workflow의 packages write 권한을 조직/저장소 정책에서 허용한다.
- 업로드에는 자동 제공되는 GITHUB_TOKEN을 사용한다. AWS/GCP 키나 별도 업로드 PAT는 필요하지 않다.
- 기존 GHCR package를 재사용한다면 해당 저장소에 package의 Actions 접근 권한이 있어야 한다.
- Repository variable `NEXT_PUBLIC_API_BASE_URL`은 선택 사항이다. 미설정/빈 문자열이면 브라우저의 현재 도메인으로 `/api/v1/...`를 호출한다. Nginx가 `/api/`를 백엔드로 전달해야 한다.
- 별도 API 도메인을 쓰면 HTTPS origin을 넣는다. 예: `https://api.example.com` (끝 `/` 제외).
- NEXT_PUBLIC 값은 공개되며 빌드 시 고정된다. 컨테이너 실행 시 환경변수를 바꿔도 브라우저 번들은 바뀌지 않는다. 변경 시 이미지를 다시 빌드한다. 비밀값을 넣지 않는다.
- PR 검사를 실행하지 않으므로 이 workflow의 `verify`, `image`를 PR 병합 필수 검사로 설정하지 않는다. 기존 필수 검사 설정이 있다면 조정해야 병합 대기가 발생하지 않는다.
- 머지를 통해서만 반영하려면 develop/main 직접 push를 브랜치 보호 규칙으로 제한한다. CI 오류는 머지 후 발견될 수 있다.

## 수동 배포 준비

- 현재 이미지는 linux/amd64 전용이다. AWS/GCP에서 x86_64 서버를 사용한다. ARM/Graviton은 별도 이미지 빌드 설정이 필요하다.
- private GHCR image를 받는 서버는 package 접근 가능한 계정의 최소 `read:packages` 토큰으로 로그인한다. GitHub Actions의 GITHUB_TOKEN은 서버 로그인용이 아니다.
- 서버 Compose에서 전체 SHA image reference를 지정한 후 `docker compose pull frontend`, `docker compose up -d --no-deps frontend` 순서로 적용한다. `frontend` 서비스는 후속 Compose 작업에서 정의한다.
- 이전 image reference를 보관한다. 실패 시 이전 reference로 되돌려 같은 절차를 수행한다.
- 실행 포트는 3000이고 일반 node 사용자로 실행한다. 외부에는 Nginx HTTPS만 공개한다.
- 배포 후 화면, 정적 이미지, 로그인/갱신/로그아웃, 실제 API, SSE 및 로딩/빈 상태/오류 상태를 별도 검증한다.

## 로컬 이미지 검증

```sh
docker build --build-arg NEXT_PUBLIC_API_BASE_URL= -t logistics-king-frontend:local .
docker run --rm -p 127.0.0.1:3000:3000 logistics-king-frontend:local
```

운영 Compose, Nginx/HTTPS, 백엔드 연결, 서버 방화벽은 후속 배포 작업이다.
