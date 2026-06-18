export type ApiCode = "SUCCESS" | string;

// 백엔드 공통 응답 모양입니다.
// 실제 데이터는 항상 payload.response 안에 들어옵니다.
export type ApiPayload<T> = {
  code: ApiCode;
  errorMessage: string | null;
  response: T | null;
};

export type ApiEnvelope<T> = {
  payload: ApiPayload<T>;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// 백엔드 enum과 프론트 타입을 맞춰 둔 곳입니다.
// API 요청/응답에서 문자열을 잘못 보내면 400 INVALID_REQUEST가 날 수 있습니다.
export type UserRole = "ADMIN" | "VENDOR" | "AGENCY" | "DRIVER";

export type ProductCategory =
  | "CLOTHING"
  | "GENERAL_GOODS"
  | "FOOD"
  | "ELECTRONICS"
  | "DOCUMENT"
  | "COSMETIC"
  | "ETC";

export type ColdChainType = "NONE" | "REFRIGERATED" | "FROZEN";

export type BoxSize =
  | "SIZE_60"
  | "SIZE_80"
  | "SIZE_100"
  | "SIZE_120"
  | "SIZE_140"
  | "SIZE_160"
  | "CUSTOM";

export type Carrier =
  | "CJ"
  | "HANJIN"
  | "LOTTE"
  | "LOGEN"
  | "POST_OFFICE"
  | "CU"
  | "GS"
  | "OTHER";
