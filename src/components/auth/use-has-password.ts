"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { hasPasswordAccount } from "@/lib/auth/google";

/* `null` أثناء الجلب. فشل القراءة يعامَل كحساب بكلمة مرور: هو السلوك المعتاد،
   والخادم يرفض الطلب الخاطئ بخطئه المترجم. */
export function useHasPassword(): boolean | null {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    authClient.listAccounts().then(
      ({ data, error }) => {
        if (alive) setHasPassword(error || !data ? true : hasPasswordAccount(data));
      },
      () => {
        if (alive) setHasPassword(true);
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return hasPassword;
}
