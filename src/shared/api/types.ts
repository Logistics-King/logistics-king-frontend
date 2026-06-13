export type ApiCode = "SUCCESS" | string;

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
  | "ETC";

export type Carrier =
  | "CJ"
  | "HANJIN"
  | "LOTTE"
  | "LOGEN"
  | "POST_OFFICE"
  | "CU"
  | "GS"
  | "OTHER";
