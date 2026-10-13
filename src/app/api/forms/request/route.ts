import { NextResponse } from "next/server";
import { INTERFACE_LANGUAGE } from "@/lib/forms/contact-form";
import { submitToGoogleForm } from "@/lib/forms/google-forms";
import { CONTACT_KIND, REQUEST_FORM } from "@/lib/forms/request-form";
import { requestBodySchema, universityValue } from "@/lib/forms/request-validation";
import {
  clientIp,
  createRateLimiter,
  isHoneypotTripped,
  isTooFast,
} from "@/lib/forms/spam-guards";

/* نموذج «اطلب مقررًا» ← Google Forms. الحواجز كلها هنا؛ المصيدة المفعَّلة
   تُجاب كالنجاح ولا يُرسل شيء. المحدِّد في الذاكرة لكل نسخة من الخادم. */

const limiter = createRateLimiter();

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

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { university, universityOther, course, contact, byEmail, locale } = parsed.data;

  const ip = clientIp(req.headers);
  if (!limiter.take(ip)) {
    console.error("[forms] rate limited", { form: REQUEST_FORM.name });
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const sent = await submitToGoogleForm(REQUEST_FORM, {
    university: universityValue(university, universityOther),
    course: course.trim(),
    contact: contact.trim(),
    contactKind: byEmail ? CONTACT_KIND.email : CONTACT_KIND.phone,
    language: INTERFACE_LANGUAGE[locale],
  });
  if (!sent) return NextResponse.json({ error: "upstream failed" }, { status: 502 });

  return ok();
}
