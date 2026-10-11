"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { authErrorKey } from "@/lib/auth/errors";
import { ErrorText } from "@/components/becan/kit";

export function SignOut() {
  const t = useTranslations("Settings");
  const errors = useTranslations("Auth.Errors");
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const signOut = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(errors(authErrorKey(result.error)));
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError(errors("generic"));
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        aria-describedby={error ? "settings-sign-out-error" : undefined}
        onClick={signOut}
        className="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold text-ink disabled:opacity-60"
      >
        {t(pending ? "signingOut" : "signOut")}
      </button>
      {error ? <div role="alert"><ErrorText id="settings-sign-out-error">{error}</ErrorText></div> : null}
    </div>
  );
}
