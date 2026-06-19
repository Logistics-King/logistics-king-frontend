# 택배왕 프론트엔드

택배왕은 화주, 대리점, 배송기사, 관리자가 물류 계약 흐름을 한 화면에서 관리하는 웹 서비스입니다.

![택배왕 홈 화면](docs/screenshots/home.png)

## 사용자 안내

이 문서는 택배 관련 종사자가 택배왕을 처음 사용할 때 보는 기준으로 정리합니다.

## 공통 사용 흐름

1. 회원가입에서 역할을 선택합니다.
   - 화주: 배송 물품을 등록하고 대리점에 계약 요청을 보냅니다.
   - 대리점: 공개된 일감을 조회하고 화주에게 제안을 보냅니다.
   - 배송기사: 대리점이 요청한 배송기사 계약을 확인합니다.
   - 관리자: 모든 역할의 화면을 점검합니다.
2. 로그인합니다.
3. 역할별 프로필이 없으면 프로필 등록 화면으로 이동합니다.
4. 좌측 메뉴 또는 모바일 하단 메뉴에서 업무 화면으로 이동합니다.
5. 상단 알림 버튼에서 계약 요청, 제안, 계약 관련 알림을 확인합니다.

![로그인 화면](docs/screenshots/login.png)
![회원가입 화면](docs/screenshots/signup.png)
![계정 찾기 화면](docs/screenshots/account-recovery.png)
![알림 화면](docs/screenshots/notifications.png)

## 화주 사용법

화주는 상품을 보내는 사업자입니다. 배송 품목을 등록하고, 대리점에 계약 요청을 보내는 역할입니다.

![화주 홈 화면](docs/screenshots/vendor-home.png)

### 1. 화주 정보 등록

처음 로그인하면 상호명, 대표자명, 연락처, 사업장 주소, 주 발송 지역을 등록합니다.
이미 등록된 프로필이 있으면 기존 프로필을 조회하고 수정할 수 있습니다.

![화주 정보 화면](docs/screenshots/vendor-profile.png)

### 2. 배송 품목 등록

`화주 > 배송 품목 등록`에서 계약 요청에 사용할 배송 물품 템플릿을 등록합니다.

입력 항목:

- 품목명
- 카테고리
- 평균 가격
- 평균 무게
- 박스 크기
- 박스 수량, 낱개 수량
- 배송 목적지 주소
- 파손 주의, 액체 포함, 신선식품 여부
- 온도 관리: 일반, 냉장, 냉동

![배송 품목 등록 화면](docs/screenshots/vendor-product-create.png)

### 3. 배송 품목 조회

`화주 > 배송 품목 조회`에서 등록된 배송 품목을 검색하고 수정합니다.
품목명, 카테고리, 박스 크기, 온도 관리 조건으로 필터링할 수 있습니다.

![배송 품목 조회 화면](docs/screenshots/vendor-products.png)

### 4. 계약 요청 등록

`화주 > 계약 요청`에서 대리점에 보낼 계약 요청을 등록합니다.
배송 물품 라인은 여러 개 추가할 수 있습니다.

예시:

- 일반 의류 60사이즈 6박스
- 냉장 식품 80사이즈 2박스
- 냉동 식품 100사이즈 4박스

계약 요청 등록 시 본인 화주 프로필의 주 발송 지역과 주소가 기본값으로 적용됩니다.
품목명 입력에서는 이미 등록한 배송 품목 템플릿을 선택할 수 있습니다.

![계약 요청 등록 화면](docs/screenshots/vendor-contract-request-create.png)

### 5. 계약 요청 조회와 제안 확인

계약 요청 목록에서 진행 상태를 확인합니다.

상태:

- `OPEN`: 진행중
- `CANCELED`: 취소됨
- `REJECTED`: 거절됨
- `CONTRACTED`: 계약 완료

목록에서 계약 요청을 클릭하면 상세 정보와 대리점 제안 목록을 확인할 수 있습니다.

![계약 요청 조회 화면](docs/screenshots/vendor-contract-requests.png)

![화주 계약 화면](docs/screenshots/vendor-contracts.png)

![계약 요청 상세 화면](docs/screenshots/vendor-contract-request-detail.png)

## 대리점 사용법

대리점은 화주가 등록한 공개 계약 요청을 조회하고, 가능한 조건으로 제안을 보내는 역할입니다.

![대리점 홈 화면](docs/screenshots/agency-home.png)

### 1. 대리점 정보 등록

처음 로그인하면 택배사, 대리점명, 대표자명, 연락처, 주소, 담당 지역, 집하 조건을 등록합니다.
온도 관리는 여러 개 선택할 수 있습니다.

예시:

- 일반
- 냉장
- 냉동

![대리점 정보 화면](docs/screenshots/agency-profile.png)

### 2. 일감 조회

`대리점 > 일감 조회`에서 화주가 공개한 계약 요청을 확인합니다.
각 일감 카드에서 집하지, 물품 라인, 박스 수량, 희망 단가, 온도 관리 조건을 볼 수 있습니다.

![대리점 일감 조회 화면](docs/screenshots/agency-open-requests.png)

### 3. 제안 등록

일감 카드가 있을 때 `제안 등록` 버튼을 누르면 제안 폼이 열립니다.

입력 항목:

- 제안 단가
- 픽업 가능 시간
- 토요일 배송 가능 여부
- 반품 가능 여부
- 온도 관리
- 제안 메모

제안 등록 후 화주는 계약 요청 상세 화면에서 제안을 확인합니다.

![대리점 제안 등록 화면](docs/screenshots/agency-proposal-create.png)

### 4. 내 제안 관리

`대리점 > 내 제안`에서 내가 제출한 제안을 조회하고 관리합니다.
제출 상태의 제안은 단가와 조건을 수정하거나 철회할 수 있습니다.

![대리점 내 제안 화면](docs/screenshots/agency-proposals.png)

### 5. 대리점 계약 조회

`대리점 > 대리점 계약`에서 화주가 수락한 최종 계약을 확인합니다.
계약 카드에서는 품목명, 계약 단가, 집하 지역, 월 물량, 픽업 시간, 온도 관리 조건을 볼 수 있습니다.

![대리점 계약 화면](docs/screenshots/agency-contracts.png)

## 배송기사 사용법

배송기사는 대리점이 요청한 기사 계약을 확인하는 역할입니다.
기사 정보와 기사 계약 화면을 통해 배정된 계약과 수락 상태를 확인합니다.

## 관리자 사용법

관리자는 화주, 대리점, 배송기사 메뉴를 모두 확인할 수 있습니다.
관리자로 로그인하면 다른 역할 화면에 들어가도 관리자 전체 메뉴로 돌아올 수 있습니다.

## 화면별 주요 경로

| 역할 | 화면 | URL |
| --- | --- | --- |
| 공통 | 로그인 | `/login` |
| 공통 | 회원가입 | `/signup` |
| 화주 | 홈 | `/vendor` |
| 화주 | 화주 정보 | `/vendor/profile` |
| 화주 | 배송 품목 조회 | `/vendor/products` |
| 화주 | 배송 품목 등록 | `/vendor/products/new` |
| 화주 | 계약 요청 | `/vendor/contract-requests` |
| 화주 | 화주 계약 | `/vendor/contracts` |
| 대리점 | 홈 | `/agency` |
| 대리점 | 대리점 정보 | `/agency/profile` |
| 대리점 | 일감 조회 | `/agency/open-requests` |
| 대리점 | 내 제안 | `/agency/proposals` |
| 대리점 | 대리점 계약 | `/agency/contracts` |
| 배송기사 | 홈 | `/driver` |
| 배송기사 | 기사 정보 | `/driver/profile` |
| 관리자 | 홈 | `/admin` |

## API 연동 원칙

- 인증은 HttpOnly cookie 기반입니다.
- 로그인 이후 보호 API는 `credentials: "include"`로 호출합니다.
- 프론트는 `accessToken`, `refreshToken`을 직접 읽지 않습니다.
- 백엔드 응답은 공통적으로 `payload.response` 안의 실제 데이터를 사용합니다.
- 실패 시 `payload.code`, `payload.errorMessage`를 화면에 표시합니다.

## 프로젝트 구조

택배왕 프론트는 크게 `app`, `src/features`, `src/shared`로 나눕니다.

- `app`: URL을 만드는 폴더입니다. 예를 들어 `app/vendor/products/page.tsx`는 `/vendor/products` 화면입니다.
- `src/features`: 업무 기능별 실제 화면과 API 연동입니다. `vendor`, `agency`, `auth`, `profile` 등이 있습니다.
- `src/shared`: 여러 기능에서 같이 쓰는 공용 코드입니다. API 호출, 타입, 메뉴, 레이아웃, 알림, 주소 검색이 있습니다.
- `public`: 이미지처럼 브라우저가 직접 가져가는 정적 파일입니다.

자주 보는 파일:

- `src/shared/api/client.ts`: 백엔드 API 호출 공통 함수
- `src/shared/api/types.ts`: 백엔드 enum과 공통 응답 타입
- `src/shared/layout/AppShell.tsx`: 로그인 이후 내부 페이지 공통 레이아웃
- `src/shared/navigation/menu.tsx`: 좌측/하단 메뉴 항목
- `src/features/auth/LoginForm.tsx`: 로그인 후 역할별 이동 흐름

## 개발 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 검증

```bash
npm run lint
npm run build
```
