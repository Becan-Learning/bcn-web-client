"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { useEffect } from "react";
import { clearGoogleJoinDraft } from "./google";
import type { Account } from "./types";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({
    user: {
      phoneNumber: { type: "string", required: true },
      phoneNumberVerified: { type: "boolean", required: false, input: false, defaultValue: false },
      institutionId: { type: "string", required: true },
      majorId: { type: "string", required: true },
    },
  })],
  fetchOptions: {
    onRequest(context) {
      const lang = typeof document === "undefined" ? "ar" : document.documentElement.lang;
      context.headers.set("x-becan-locale", lang === "en" ? "en" : "ar");
    },
  },
});

export function useAccount(): { account: Account | null; isPending: boolean } {
  const { data, isPending } = authClient.useSession();
  const account = data?.user ?? null;
  /* حساب مسجَّل = انتهت رحلة Google بنجاح؛ المسودة لا حاجة لها بعد الآن. */
  useEffect(() => {
    if (account) clearGoogleJoinDraft();
  }, [account]);
  return { account, isPending };
}
