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

export type Carrier =
  | "CJ"
  | "HANJIN"
  | "LOTTE"
  | "LOGEN"
  | "POST_OFFICE"
  | "CU"
  | "GS"
  | "OTHER";
