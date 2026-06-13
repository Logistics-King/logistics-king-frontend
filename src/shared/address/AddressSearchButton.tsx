"use client";

import { useState } from "react";

type KakaoPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  sido: string;
  sigungu: string;
  bname: string;
};

type KakaoPostcodeConstructor = new (options: {
  oncomplete: (data: KakaoPostcodeData) => void;
}) => {
  open: () => void;
};

declare global {
  interface Window {
    kakao?: {
      Postcode?: KakaoPostcodeConstructor;
    };
  }
}

export type SelectedAddress = {
  postalCode: string;
  address: string;
  region: string;
};

type AddressSearchButtonProps = {
  onSelect: (address: SelectedAddress) => void;
};

const postcodeScriptSrc = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
let scriptLoadingPromise: Promise<void> | null = null;

export function AddressSearchButton({ onSelect }: AddressSearchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClick() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await loadKakaoPostcodeScript();

      if (!window.kakao?.Postcode) {
        throw new Error("주소 검색을 불러오지 못했습니다.");
      }

      new window.kakao.Postcode({
        oncomplete: (data) => {
          const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

          onSelect({
            postalCode: data.zonecode,
            address: address || data.address,
            region: [data.sido, data.sigungu].filter(Boolean).join(" "),
          });
        },
      }).open();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="h-11 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        disabled={isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? "검색 준비 중" : "주소 검색"}
      </button>
      {errorMessage ? (
        <p className="text-xs font-semibold text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function loadKakaoPostcodeScript(): Promise<void> {
  if (window.kakao?.Postcode) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${postcodeScriptSrc}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("주소 검색을 불러오지 못했습니다.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = postcodeScriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("주소 검색을 불러오지 못했습니다."));
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "주소 검색을 불러오지 못했습니다.";
}
