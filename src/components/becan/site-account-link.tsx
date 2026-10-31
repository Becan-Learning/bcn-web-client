"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAccount } from "@/lib/auth/client";

export function SiteAccountLink({ asButton }: { asButton: boolean }) {
  const t = useTranslations("SiteHeader");
  const { account } = useAccount();
  return (
    <Link
      href={account ? "/home" : "/sign-in"}
      className={
        asButton
          ? "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center whitespace-nowrap rounded-pill border border-line px-4 text-sm leading-base font-semibold text-ink md:text-base md:leading-base"
          : "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center whitespace-nowrap px-2 font-semibold text-ink-2"
      }
    >
      {t(account ? "home" : "login")}
    </Link>
  );
}
