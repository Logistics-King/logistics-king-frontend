import { apiFetch } from "@/src/shared/api/client";

export type ProposalNegotiationActorType = "VENDOR" | "AGENCY";

export type ProposalNegotiationEventType =
  | "PRICE_OFFER"
  | "PRICE_ACCEPTED"
  | "PRICE_REJECTED";

export type ProposalNegotiationEventStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "RECORDED";

export type ProposalNegotiationEvent = {
  eventId: string;
  proposalId: string;
  sequence: number;
  actorType: ProposalNegotiationActorType;
  eventType: ProposalNegotiationEventType;
  unitPrice: number | null;
  items: ProposalNegotiationLinePriceItem[];
  memo: string | null;
  status: ProposalNegotiationEventStatus;
};

type ProposalNegotiationEventsResponse = {
  items: ProposalNegotiationEvent[];
};

export type ProposalNegotiationMemoRequest = {
  memo: string | null;
};

export type ProposalPriceOfferRequest = ProposalNegotiationMemoRequest & {
  unitPrice: number;
  items: ProposalNegotiationLinePriceRequest[];
};

export type ProposalNegotiationLinePriceRequest = {
  contractRequestItemId: string;
  unitPrice: number;
};

export type ProposalNegotiationLinePriceItem = ProposalNegotiationLinePriceRequest & {
  itemId: string;
};

export function getProposalNegotiations(
  proposalId: string,
): Promise<ProposalNegotiationEvent[]> {
  return apiFetch<ProposalNegotiationEventsResponse>(
    `/api/v1/proposals/${proposalId}/negotiations`,
    {
      credentials: "include",
    },
  ).then((response) => response.items);
}

export function createProposalPriceOffer(
  proposalId: string,
  request: ProposalPriceOfferRequest,
): Promise<ProposalNegotiationEvent> {
  return apiFetch(`/api/v1/proposals/${proposalId}/negotiations/price-offers`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function acceptProposalNegotiation(
  proposalId: string,
  eventId: string,
  request: ProposalNegotiationMemoRequest,
): Promise<ProposalNegotiationEvent> {
  return apiFetch(`/api/v1/proposals/${proposalId}/negotiations/${eventId}/accept`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function rejectProposalNegotiation(
  proposalId: string,
  eventId: string,
  request: ProposalNegotiationMemoRequest,
): Promise<ProposalNegotiationEvent> {
  return apiFetch(`/api/v1/proposals/${proposalId}/negotiations/${eventId}/reject`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}
