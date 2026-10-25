import { NextResponse } from "next/server";
import { z } from "zod";
import { CONTACT_FORM, INTERFACE_LANGUAGE } from "@/lib/forms/contact-form";
import {
  CONTACT_TOPICS,
  isValidContact,
  isValidMessage,
} from "@/lib/forms/contact-validation";
import { submitToGoogleForm } from "@/lib/forms/google-forms";
import {
  clientIp,
  createRateLimiter,
  isHoneypotTripped,
  isTooFast,
} from "@/lib/forms/spam-guards";

/* نموذج التواصل ← Google Forms. الحواجز كلها هنا؛ المصيدة المفعَّلة
   تُجاب كالنجاح ولا يُرسل شيء. المحدِّد في الذاكرة لكل نسخة من الخادم. */

const limiter = createRateLimiter();

const bodySchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  contact: z.string().refine(isValidContact),
  message: z.string().refine(isValidMessage),
  locale: z.enum(["ar", "en"]),
});

const ok = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;

  if (isHoneypotTripped(body.website) || isTooFast(body.startedAt)) return ok();

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { topic, contact, message, locale } = parsed.data;

  const ip = clientIp(req.headers);
  if (!limiter.take(ip)) {
    console.error("[forms] rate limited", { form: CONTACT_FORM.name });
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const sent = await submitToGoogleForm(CONTACT_FORM, {
    topic,
    contact: contact.trim(),
    message: message.trim(),
    language: INTERFACE_LANGUAGE[locale],
  });
  if (!sent) return NextResponse.json({ error: "upstream failed" }, { status: 502 });

  return ok();
}
