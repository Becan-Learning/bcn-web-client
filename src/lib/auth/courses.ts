import "server-only";

import { headers } from "next/headers";
import { z } from "zod";
import { backendUrl } from "./backend";
import { studentHeaders } from "./forwarded-headers";
import { backendErrorSchema, courseSchema, coursesSchema, enrollmentsSchema } from "@/lib/courses/schema";

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: "network" | "http" | "invalid"; status?: number; code?: string };

async function readBackend<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, init: RequestInit): Promise<BackendResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${backendUrl()}/api/v1${path}`, init);
  } catch {
    console.error("Courses backend request failed", { path });
    return { ok: false, kind: "network" };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    console.error("Invalid courses backend JSON", { path, status: response.status });
    return { ok: false, kind: "invalid", status: response.status };
  }
  if (!response.ok) {
    const parsed = backendErrorSchema.safeParse(data);
    console.error("Courses backend request failed", { path, status: response.status, code: parsed.success ? parsed.data.error.code : undefined });
    return parsed.success
      ? { ok: false, kind: "http", status: response.status, code: parsed.data.error.code }
      : { ok: false, kind: "invalid", status: response.status };
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid courses backend response", { path, status: response.status });
    return { ok: false, kind: "invalid", status: response.status };
  }
  return { ok: true, data: parsed.data };
}

export function getCourses() {
  return readBackend("/courses", coursesSchema, { next: { revalidate: 300 } });
}

export function getCourse(id: string) {
  return readBackend(`/courses/${encodeURIComponent(id)}`, courseSchema, { next: { revalidate: 300 } });
}

export async function getEnrollments() {
  /* قراءة الطلب خارج التقاط أخطاء الشبكة كي تبقى إشارات الرسم الديناميكي سليمة. */
  const forwarded = studentHeaders(await headers());
  return readBackend("/me/enrollments", enrollmentsSchema, { headers: forwarded, cache: "no-store" });
}
