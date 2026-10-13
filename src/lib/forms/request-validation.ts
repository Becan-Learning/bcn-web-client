import { z } from "zod";
import { isValidEmail, isValidSaudiMobile } from "./contact-validation";

/* قواعد نموذج «اطلب مقررًا» — يشترك فيها العميل والمسار فلا تتباعد.
   قيمة «other» في حقل الجامعة تعني اسمًا مكتوبًا يدويًا. */

export const OTHER_UNIVERSITY = "other";

/** بريد حين يختار الطالب البريد، وإلا جوال سعودي. */
export function isValidRequestContact(value: string, byEmail: boolean): boolean {
  return byEmail ? isValidEmail(value) : isValidSaudiMobile(value);
}

/** الجامعة المرسَلة: معرّف المؤسسة، أو الاسم المكتوب عند «أخرى». */
export function universityValue(university: string, universityOther: string): string {
  return university === OTHER_UNIVERSITY ? universityOther.trim() : university.trim();
}

export const requestBodySchema = z
  .object({
    university: z.string().trim().min(1),
    universityOther: z.string(),
    course: z.string().trim().min(1),
    contact: z.string(),
    byEmail: z.boolean(),
    locale: z.enum(["ar", "en"]),
  })
  .superRefine((value, ctx) => {
    if (value.university === OTHER_UNIVERSITY && !value.universityOther.trim()) {
      ctx.addIssue({ code: "custom", path: ["universityOther"] });
    }
    if (!isValidRequestContact(value.contact, value.byEmail)) {
      ctx.addIssue({ code: "custom", path: ["contact"] });
    }
  });
