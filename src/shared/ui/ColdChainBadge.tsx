import type { ReactNode, SVGProps } from "react";
import type { ColdChainType } from "@/src/shared/api/types";

type ColdChainBadgeProps = {
  type: ColdChainType;
};

const coldChainMeta: Record<
  ColdChainType,
  {
    Icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
    className: string;
    label: string;
  }
> = {
  NONE: {
    Icon: NormalIcon,
    className: "border-slate-200 bg-slate-50 text-slate-600",
    label: "일반",
  },
  REFRIGERATED: {
    Icon: RefrigeratedIcon,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "냉장",
  },
  FROZEN: {
    Icon: FrozenIcon,
    className: "border-sky-200 bg-sky-50 text-sky-700",
    label: "냉동",
  },
};

export function ColdChainBadge({ type }: ColdChainBadgeProps) {
  const meta = coldChainMeta[type];
  const Icon = meta.Icon;

  return (
    <span
      className={`inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-bold leading-none ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function NormalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M5 8.5h14M7 8.5V18h10V8.5M9 8.5V6.75A2.75 2.75 0 0 1 11.75 4h.5A2.75 2.75 0 0 1 15 6.75V8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function RefrigeratedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M10 14.25V5a2 2 0 1 1 4 0v9.25a4 4 0 1 1-4 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 8v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FrozenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 3v18M5.6 6.2l12.8 11.6M18.4 6.2 5.6 17.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m8.5 4.5 3.5 3.5 3.5-3.5M8.5 19.5l3.5-3.5 3.5 3.5M3.8 10.5l4.8 1.3-1.3 4.7M20.2 13.5l-4.8-1.3 1.3-4.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
