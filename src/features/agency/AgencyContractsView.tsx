"use client";

import { ContractsListView } from "@/src/features/contracts/ContractsListView";
import { getAgencyContracts } from "./api";

export function AgencyContractsView() {
  return (
    <ContractsListView
      counterparty="VENDOR"
      counterpartyLabel="화주"
      emptyMessage="확정된 대리점 계약이 없습니다."
      loadContracts={getAgencyContracts}
    />
  );
}
