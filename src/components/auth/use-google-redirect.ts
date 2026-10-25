"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

type SocialRequest = Parameters<typeof authClient.signIn.social>[0];
type SocialError = { code?: string; status?: number };

/* المكتبة تحوّل المتصفح إلى Google بعد نجاح الطلب؛ نبقي الزر معطّلًا إلى ذلك الحين،
   ونفكّه إن عاد الطالب بزر الرجوع من الذاكرة المؤقتة للصفحة. */
export function useGoogleRedirect() {
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  /* يعيد الخطأ إن فشل الطلب قبل التحويل، و`null` إن بدأ التحويل. */
  const start = async (request: SocialRequest): Promise<SocialError | null> => {
    setRedirecting(true);
    try {
      const { error } = await authClient.signIn.social(request);
      if (error) setRedirecting(false);
      return error ?? null;
    } catch {
      setRedirecting(false);
      return {};
    }
  };

  return { redirecting, start };
}
