"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  acceptProposalNegotiation,
  createProposalPriceOffer,
  getProposalNegotiations,
  rejectProposalNegotiation,
  type ProposalNegotiationActorType,
  type ProposalNegotiationEvent,
} from "./negotiation";

type ProposalNegotiationPanelProps = {
  myRole: ProposalNegotiationActorType;
  onChanged: () => void | Promise<void>;
  pendingNegotiationId: string | null;
  proposalId: string;
  proposalStatus: string;
};

export function ProposalNegotiationPanel({
  myRole,
  onChanged,
  pendingNegotiationId,
  proposalId,
  proposalStatus,
}: ProposalNegotiationPanelProps) {
  const [events, setEvents] = useState<ProposalNegotiationEvent[]>([]);
  const [unitPrice, setUnitPrice] = useState("");
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
  const canCreateOffer =
    !pendingNegotiationId && (proposalStatus === "SUBMITTED" || proposalStatus === "NEGOTIATING");
  const canRespondToPending =
    pendingEvent?.eventType === "PRICE_OFFER" &&
    pendingEvent.status === "PENDING" &&
    pendingEvent.actorType !== myRole;

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

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createProposalPriceOffer(proposalId, {
        unitPrice: nextUnitPrice,
        memo: blankToNull(memo),
      });
      setUnitPrice("");
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
          <h4 className="text-sm font-bold text-slate-950">단가 조율</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
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
        ) : events.length > 0 ? (
          events.map((event) => (
            <NegotiationEventCard event={event} isMine={event.actorType === myRole} key={event.eventId} />
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
            상대 제안 단가 {formatCurrency(pendingEvent.unitPrice)}
          </p>
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
            placeholder="새 단가"
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
  event,
  isMine,
}: {
  event: ProposalNegotiationEvent;
  isMine: boolean;
}) {
  return (
    <article className={`grid gap-1 rounded-md bg-white px-3 py-3 ${isMine ? "ml-6" : "mr-6"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-400">
          #{event.sequence} {isMine ? "내 조율" : "상대 조율"} · {formatEventType(event.eventType)}
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
          {formatEventStatus(event.status)}
        </span>
      </div>
      {event.unitPrice !== null ? (
        <p className="text-sm font-bold text-slate-950">{formatCurrency(event.unitPrice)}</p>
      ) : null}
      {event.memo ? <p className="text-sm leading-6 text-slate-600">{event.memo}</p> : null}
    </article>
  );
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

function formatEventType(type: ProposalNegotiationEvent["eventType"]): string {
  const labels: Record<ProposalNegotiationEvent["eventType"], string> = {
    PRICE_OFFER: "단가 제안",
    PRICE_ACCEPTED: "단가 수락",
    PRICE_REJECTED: "단가 거절",
  };

  return labels[type];
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "단가 조율을 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10 disabled:cursor-not-allowed disabled:bg-slate-100";
