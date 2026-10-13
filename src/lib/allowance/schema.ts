import { z } from "zod";

const countSchema = z.number().int().nonnegative();
const limitSchema = countSchema.nullable();

export const allowanceSchema = z.object({
  plan: z.object({
    id: z.string().min(1),
    name: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
  }),
  period: z.object({
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
  }),
  limits: z.object({
    sessions: limitSchema,
    seconds: limitSchema,
    enrollments: limitSchema,
    sessionSeconds: limitSchema,
    minStartSeconds: limitSchema,
  }),
  usage: z.object({
    sessions: countSchema,
    seconds: countSchema,
    enrollments: countSchema,
  }),
});

export type Allowance = z.infer<typeof allowanceSchema>;
