import { NextResponse } from "next/server";
import { Langfuse } from "langfuse";

/* تقييم الجلسة — يُعلَّق على أثر Langfuse الذي كتبه الوكيل لنفس
   الغرفة إن وُجد، وإلا يُنشأ أثر مستقل يحمل معرّف الجلسة. */

async function findTraceIdBySessionId(
  langfuseHost: string,
  publicKey: string,
  secretKey: string,
  sessionId: string,
): Promise<string | null> {
  const url = `${langfuseHost}/api/public/traces?sessionId=${encodeURIComponent(sessionId)}&limit=1&orderBy=timestamp.desc&fields=core`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.data?.[0]?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, sessionExperience, notes } = body ?? {};

    if (typeof sessionId !== "string" || !sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (
      sessionExperience != null &&
      !(Number.isInteger(sessionExperience) && sessionExperience >= 1 && sessionExperience <= 5)
    ) {
      return NextResponse.json({ error: "invalid sessionExperience" }, { status: 400 });
    }
    if (notes != null && typeof notes !== "string") {
      return NextResponse.json({ error: "invalid notes" }, { status: 400 });
    }

    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const langfuseHost = process.env.LANGFUSE_HOST;
    if (!publicKey || !secretKey || !langfuseHost) {
      return NextResponse.json(
        { error: "Server misconfigured: Langfuse keys missing" },
        { status: 500 },
      );
    }

    const langfuse = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: langfuseHost,
      environment: process.env.NODE_ENV || "development",
    });

    const existingTraceId = await findTraceIdBySessionId(
      langfuseHost,
      publicKey,
      secretKey,
      sessionId,
    );

    const trace = existingTraceId
      ? langfuse.trace({ id: existingTraceId })
      : langfuse.trace({
          id: `feedback-${sessionId}-${Date.now()}`,
          sessionId,
          name: "session-feedback",
        });

    if (sessionExperience != null) {
      trace.score({
        name: "session-experience-rating",
        value: sessionExperience,
        dataType: "NUMERIC",
      });
    }

    const trimmed = typeof notes === "string" ? notes.trim().slice(0, 2000) : "";
    if (trimmed) {
      trace.score({
        name: "session-notes",
        value: trimmed,
        dataType: "CATEGORICAL",
      });
    }

    await langfuse.flushAsync();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
