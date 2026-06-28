"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  acceptProposalNegotiation,
  createProposalPriceOffer,
  getProposalNegotiations,
  rejectProposalNegotiation,
  type ProposalNegotiationActorType,
  type ProposalNegotiationEvent,
  type ProposalNegotiationLinePriceItem,
} from "./negotiation";

type ProposalLinePriceFormState = {
  contractRequestItemId: string;
  unitPrice: string;
};

export type ProposalNegotiationRequestItemContext = {
  contractRequestItemId: string;
  productName: string;
  boxSize: string;
  boxQuantity: number;
  itemQuantity: number;
};

type ProposalNegotiationPanelProps = {
  actorLabels?: Partial<Record<ProposalNegotiationActorType, string>>;
  myRole: ProposalNegotiationActorType;
  onChanged: () => void | Promise<void>;
  pendingNegotiationId: string | null;
  proposalItems: ProposalNegotiationLinePriceItem[];
  proposalId: string;
  proposalStatus: string;
  requestItems?: ProposalNegotiationRequestItemContext[];
};

export function ProposalNegotiationPanel({
  actorLabels = {},
  myRole,
  onChanged,
  pendingNegotiationId,
  proposalItems,
  proposalId,
  proposalStatus,
  requestItems = [],
}: ProposalNegotiationPanelProps) {
  const [events, setEvents] = useState<ProposalNegotiationEvent[]>([]);
  const [unitPrice, setUnitPrice] = useState(toRepresentativeUnitPrice(proposalItems));
  const [linePrices, setLinePrices] = useState<ProposalLinePriceFormState[]>(
    toLinePriceFormState(proposalItems),
  );
  const [memo, setMemo] = useState("");
  const [responseMemo, setResponseMemo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingEventId, setActingEventId] = useState<string | null>(null);

  const pendingEvent = useMemo(
    () => events.find((event) => event.eventId === pendingNegotiationId) ?? null,
    [events, pendingNegotiationId],
  );
  const visibleEvents = useMemo(
    () => events.filter((event) => event.eventType === "PRICE_OFFER"),
    [events],
  );
  const canCreateOffer =
    !pendingNegotiationId && (proposalStatus === "SUBMITTED" || proposalStatus === "NEGOTIATING");
  const canRespondToPending =
    pendingEvent?.eventType === "PRICE_OFFER" &&
    pendingEvent.status === "PENDING" &&
    pendingEvent.actorType !== myRole;
  const requestItemById = useMemo(
    () => new Map(requestItems.map((item) => [item.contractRequestItemId, item])),
    [requestItems],
  );

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextEvents = await getProposalNegotiations(proposalId);

        if (active) {
          setEvents(nextEvents);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      active = false;
    };
  }, [proposalId]);

  async function refreshEvents() {
    const nextEvents = await getProposalNegotiations(proposalId);
    setEvents(nextEvents);
  }

  async function handleCreateOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUnitPrice = normalizeIntegerInput(unitPrice);
    const nextUnitPrice = Number(normalizedUnitPrice);

    if (!nextUnitPrice || nextUnitPrice < 1) {
      setErrorMessage("조율 단가는 1원 이상 입력해야 합니다.");
      return;
    }

    const invalidLine = linePrices.find((item) => {
      const lineUnitPrice = Number(normalizeIntegerInput(item.unitPrice));

      return !lineUnitPrice || lineUnitPrice < 1;
    });

    if (invalidLine) {
      setErrorMessage("품목 라인별 조율 단가는 모두 1원 이상 입력해야 합니다.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createProposalPriceOffer(proposalId, {
        unitPrice: nextUnitPrice,
        items: linePrices.map((item) => ({
          contractRequestItemId: item.contractRequestItemId,
          unitPrice: Number(normalizeIntegerInput(item.unitPrice)),
        })),
        memo: blankToNull(memo),
      });
      setUnitPrice(String(nextUnitPrice));
      setMemo("");
      await refreshEvents();
      await onChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRespond(eventId: string, action: "accept" | "reject") {
    setActingEventId(eventId);
    setErrorMessage("");

    try {
      const request = { memo: blankToNull(responseMemo) };

      if (action === "accept") {
        await acceptProposalNegotiation(proposalId, eventId, request);
      } else {
        await rejectProposalNegotiation(proposalId, eventId, request);
      }

      setResponseMemo("");
      await refreshEvents();
      await onChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingEventId(null);
    }
  }

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-950">
            이 계약의 배송 품목별 단가 조율
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            아래 행은 서로 다른 계약이 아니라, 같은 계약 안에 포함된 배송 품목 라인입니다.
            상대가 응답해야 다음 조율이나 최종 수락을 진행할 수 있습니다.
          </p>
        </div>
        {pendingNegotiationId ? (
          <span className="w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
            응답 대기
          </span>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-2">
        {isLoading ? (
          <p className="rounded-md bg-white px-3 py-3 text-sm text-slate-500">
            조율 내역을 불러오는 중입니다.
          </p>
        ) : visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <NegotiationEventCard
              actorLabel={formatActorLabel(event.actorType, myRole, actorLabels)}
              event={event}
              key={event.eventId}
              requestItemById={requestItemById}
            />
          ))
        ) : (
          <p className="rounded-md bg-white px-3 py-3 text-sm text-slate-500">
            아직 단가 조율 내역이 없습니다.
          </p>
        )}
      </div>

      {canRespondToPending && pendingEvent ? (
        <div className="grid gap-2 rounded-md border border-amber-200 bg-white p-3">
          <p className="text-sm font-bold text-slate-900">
            이 계약의 상대 제안 대표 단가 {formatCurrency(pendingEvent.unitPrice)}
          </p>
          {(pendingEvent.items ?? []).length > 0 ? (
            <NegotiationLinePrices
              items={pendingEvent.items}
              requestItemById={requestItemById}
              status={pendingEvent.status}
            />
          ) : null}
          <textarea
            className={`${inputClassName} min-h-20 resize-y py-3`}
            placeholder="응답 메모"
            value={responseMemo}
            onChange={(event) => setResponseMemo(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="h-10 rounded-md border border-red-300 px-4 text-sm font-bold text-red-600 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actingEventId === pendingEvent.eventId}
              onClick={() => handleRespond(pendingEvent.eventId, "reject")}
              type="button"
            >
              거절
            </button>
            <button
              className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={actingEventId === pendingEvent.eventId}
              onClick={() => handleRespond(pendingEvent.eventId, "accept")}
              type="button"
            >
              수락
            </button>
          </div>
        </div>
      ) : null}

      <form className="grid gap-2 rounded-md border border-slate-200 bg-white p-3" onSubmit={handleCreateOffer}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,180px)_1fr]">
          <input
            className={inputClassName}
            disabled={!canCreateOffer || isSubmitting}
            inputMode="numeric"
            placeholder="계약 대표 단가"
            readOnly={linePrices.length > 0}
            value={formatIntegerInput(unitPrice)}
            onChange={(event) => setUnitPrice(normalizeIntegerInput(event.target.value))}
          />
          <input
            className={inputClassName}
            disabled={!canCreateOffer || isSubmitting}
            placeholder="조율 메모"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </div>
        {linePrices.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-bold text-slate-500">배송 품목 라인별 조율 단가</p>
            {linePrices.map((item, index) => (
              <ProposalLinePriceInput
                index={index}
                item={item}
                key={item.contractRequestItemId}
                requestItem={requestItemById.get(item.contractRequestItemId)}
                onChange={(nextUnitPrice) => {
                  const nextItems = linePrices.map((currentItem) =>
                    currentItem.contractRequestItemId === item.contractRequestItemId
                      ? { ...currentItem, unitPrice: nextUnitPrice }
                      : currentItem,
                  );

                  setLinePrices(nextItems);
                  setUnitPrice(String(calculateAverageUnitPrice(nextItems)));
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="flex justify-end">
          <button
            className="h-10 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canCreateOffer || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "제안 중" : "단가 제안"}
          </button>
        </div>
      </form>
    </section>
  );
}

function NegotiationEventCard({
  actorLabel,
  event,
  requestItemById,
}: {
  actorLabel: string;
  event: ProposalNegotiationEvent;
  requestItemById: Map<string, ProposalNegotiationRequestItemContext>;
}) {
  return (
    <article className="grid gap-2 rounded-md bg-white px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{actorLabel}의 단가 제안</p>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${getEventStatusClassName(
            event.status,
          )}`}
        >
          {formatEventStatus(event.status)}
        </span>
      </div>
      {event.unitPrice !== null ? (
        <p className={`text-sm font-bold ${getEventPriceClassName(event.status)}`}>
          {formatCurrency(event.unitPrice)}
        </p>
      ) : null}
      {(event.items ?? []).length > 0 ? (
        <NegotiationLinePrices
          items={event.items}
          requestItemById={requestItemById}
          status={event.status}
        />
      ) : null}
      {event.memo ? <p className="text-sm leading-6 text-slate-600">{event.memo}</p> : null}
    </article>
  );
}

function ProposalLinePriceInput({
  index,
  item,
  onChange,
  requestItem,
}: {
  index: number;
  item: ProposalLinePriceFormState;
  onChange: (unitPrice: string) => void;
  requestItem?: ProposalNegotiationRequestItemContext;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 sm:grid-cols-[1fr_160px] sm:items-center">
      <div>
        <p className="text-sm font-bold text-slate-700">
          배송 품목 라인 {index + 1}. {requestItem?.productName ?? "배송 물품"}
        </p>
        {requestItem ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {requestItem.boxSize} / {formatLineQuantity(requestItem)}
          </p>
        ) : null}
      </div>
      <input
        className={inputClassName}
        inputMode="numeric"
        placeholder="라인 단가"
        value={formatIntegerInput(item.unitPrice)}
        onChange={(event) => onChange(normalizeIntegerInput(event.target.value))}
      />
    </div>
  );
}

function NegotiationLinePrices({
  items,
  requestItemById,
  status,
}: {
  items: ProposalNegotiationLinePriceItem[];
  requestItemById: Map<string, ProposalNegotiationRequestItemContext>;
  status: ProposalNegotiationEvent["status"];
}) {
  return (
    <div className="grid gap-1">
      {items.map((item, index) => (
        <p
          className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
          key={item.itemId}
        >
          배송 품목 라인 {index + 1}
          {formatRequestItemLabel(requestItemById.get(item.contractRequestItemId))}:{" "}
          <span className={getEventPriceClassName(status)}>{formatCurrency(item.unitPrice)}</span>
        </p>
      ))}
    </div>
  );
}

function formatRequestItemLabel(
  requestItem: ProposalNegotiationRequestItemContext | undefined,
): string {
  if (!requestItem) {
    return "";
  }

  return ` · ${requestItem.productName} / ${requestItem.boxSize} / ${formatLineQuantity(requestItem)}`;
}

function formatLineQuantity(item: ProposalNegotiationRequestItemContext): string {
  const quantities = [
    item.boxQuantity > 0 ? `박스 ${item.boxQuantity.toLocaleString("ko-KR")}개` : "",
    item.itemQuantity > 0 ? `낱개 ${item.itemQuantity.toLocaleString("ko-KR")}개` : "",
  ].filter(Boolean);

  return quantities.length > 0 ? quantities.join(" / ") : "-";
}

function toLinePriceFormState(
  proposalItems: ProposalNegotiationLinePriceItem[],
): ProposalLinePriceFormState[] {
  return proposalItems.map((item) => ({
    contractRequestItemId: item.contractRequestItemId,
    unitPrice: String(item.unitPrice),
  }));
}

function calculateAverageUnitPrice(items: ProposalLinePriceFormState[]): number {
  const validPrices = items
    .map((item) => Number(normalizeIntegerInput(item.unitPrice)))
    .filter((price) => price > 0);

  if (validPrices.length === 0) {
    return 0;
  }

  return Math.round(validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length);
}

function toRepresentativeUnitPrice(proposalItems: ProposalNegotiationLinePriceItem[]): string {
  if (proposalItems.length === 0) {
    return "";
  }

  return String(calculateAverageUnitPrice(toLinePriceFormState(proposalItems)));
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatIntegerInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function formatCurrency(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatActorLabel(
  actorType: ProposalNegotiationActorType,
  myRole: ProposalNegotiationActorType,
  actorLabels: Partial<Record<ProposalNegotiationActorType, string>>,
): string {
  if (actorLabels[actorType]) {
    return actorLabels[actorType];
  }

  if (actorType === myRole) {
    return "내";
  }

  return actorType === "AGENCY" ? "대리점" : "화주";
}

function formatEventStatus(status: ProposalNegotiationEvent["status"]): string {
  const labels: Record<ProposalNegotiationEvent["status"], string> = {
    PENDING: "응답 대기",
    ACCEPTED: "수락됨",
    REJECTED: "거절됨",
    RECORDED: "기록됨",
  };

  return labels[status];
}

function getEventStatusClassName(status: ProposalNegotiationEvent["status"]): string {
  const classNames: Record<ProposalNegotiationEvent["status"], string> = {
    PENDING: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    RECORDED: "bg-slate-100 text-slate-600",
  };

  return classNames[status];
}

function getEventPriceClassName(status: ProposalNegotiationEvent["status"]): string {
  const classNames: Record<ProposalNegotiationEvent["status"], string> = {
    PENDING: "text-amber-700",
    ACCEPTED: "text-emerald-700",
    REJECTED: "text-red-700",
    RECORDED: "text-slate-700",
  };

  return classNames[status];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "단가 조율을 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10 disabled:cursor-not-allowed disabled:bg-slate-100";
