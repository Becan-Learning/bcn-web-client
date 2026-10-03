"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useInterfaceLanguage } from "./use-interface-language";

export function ArabicVersionLink({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const switchLanguage = useInterfaceLanguage();

  return (
    <Link
      href={pathname}
      locale="ar"
      onNavigate={(event) => {
        event.preventDefault();
        switchLanguage("ar");
      }}
      className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </Link>
  );
}
