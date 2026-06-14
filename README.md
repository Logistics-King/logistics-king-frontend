This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Structure

택배왕 프론트는 크게 `app`, `src/features`, `src/shared`로 나눕니다.

- `app`: URL을 만드는 폴더입니다. 예를 들어 `app/vendor/products/page.tsx`는 `/vendor/products` 화면입니다. 보통 여기에는 화면 껍데기만 두고 복잡한 로직은 `src/features`로 넘깁니다.
- `src/features`: 업무 기능별 실제 화면과 API 연동입니다. 예를 들어 `src/features/vendor`는 화주, `src/features/agency`는 대리점, `src/features/auth`는 로그인/회원가입입니다.
- `src/shared`: 여러 기능에서 같이 쓰는 공용 코드입니다. API 호출 공통 함수, 타입, 메뉴, 레이아웃, 알림, 주소 검색 같은 코드가 여기에 있습니다.
- `public`: 이미지처럼 브라우저가 직접 가져가는 정적 파일입니다. `/images/...` 경로로 사용할 수 있습니다.

자주 보는 파일:

- `src/shared/api/client.ts`: 백엔드 API 호출을 모아둔 공통 fetch 함수입니다.
- `src/shared/api/types.ts`: 백엔드 enum과 공통 응답 타입을 모아둔 파일입니다.
- `src/shared/layout/AppShell.tsx`: 로그인 이후 내부 페이지의 공통 레이아웃입니다.
- `src/shared/navigation/menu.tsx`: 좌측/하단 메뉴 항목을 정의합니다.
- `src/features/auth/LoginForm.tsx`: 로그인 후 역할별 홈 또는 프로필 등록 화면으로 이동시키는 흐름이 있습니다.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
