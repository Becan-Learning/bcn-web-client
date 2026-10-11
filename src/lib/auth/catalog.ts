import "server-only";

import { z } from "zod";
import type { Localized } from "@/i18n/localized";

export type Institution = {
  id: string;
  name: Localized;
  majors: { id: string; name: Localized }[];
};

const localizedSchema = z.object({ ar: z.string(), en: z.string() });
const institutionsSchema = z.array(z.object({
  id: z.string(),
  name: localizedSchema,
  majors: z.array(z.object({ id: z.string(), name: localizedSchema })),
}));

export async function getInstitutions(): Promise<Institution[]> {
  try {
    const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "") || "http://localhost:3000";
    const response = await fetch(`${backendUrl}/api/v1/institutions`, { next: { revalidate: 300 } });
    if (!response.ok) {
      console.error("Institutions request failed", { status: response.status });
      return [];
    }
    const parsed = institutionsSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("Invalid institutions response");
      return [];
    }
    return parsed.data;
  } catch {
    console.error("Institutions request failed");
    return [];
  }
}
