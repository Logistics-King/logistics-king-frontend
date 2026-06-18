"use client";

import { ContractsListView } from "@/src/features/contracts/ContractsListView";
import { getVendorContracts } from "./api";

export function VendorContractsView() {
  return (
    <ContractsListView
      counterparty="AGENCY"
      counterpartyLabel="대리점"
      emptyMessage="생성된 화주 계약이 없습니다."
      loadContracts={getVendorContracts}
    />
  );
}
