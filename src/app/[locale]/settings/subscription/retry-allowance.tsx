"use client";

import { useRouter } from "@/i18n/navigation";

export function RetryAllowance({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="mt-4 inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold text-ink"
    >
      {label}
    </button>
  );
}
