import { z } from "zod";

/* عقد `GET /api/v1/plans` — docs/backend-courses-handoff.md.
   كل حدّ قد يكون null ومعناه بلا حد. */

const limitSchema = z.number().int().nonnegative().nullable();
const localizedSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });

export const planSchema = z.object({
  id: z.string().min(1),
  name: localizedSchema,
  /** سعر دورة واحدة شاملًا الضريبة، بالهللات */
  priceHalalas: z.number().int().nonnegative(),
  featured: z.boolean(),
  badge: localizedSchema.nullable(),
  limits: z.object({
    sessions: limitSchema,
    seconds: limitSchema,
    enrollments: limitSchema,
    sessionSeconds: limitSchema,
    minStartSeconds: limitSchema,
  }),
});

/* قائمة فارغة لا تعرض شيئًا، فتُعامَل كاستجابة غير صالحة. */
export const plansResponseSchema = z.object({ plans: z.array(planSchema).min(1) });

export type ApiPlan = z.infer<typeof planSchema>;
