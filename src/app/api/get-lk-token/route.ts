import { AccessToken } from "livekit-server-sdk";
import { getAccountFromCookie } from "@/lib/auth/session";

/* رمز الدخول لغرفة LiveKit.

   سمات المشارك (`attributes`) عقدٌ مع الوكيل الخارجي — يقرأ منها
   المقرر والفصل واللغة ونمط الشرح. لا تُغيَّر أسماؤها من هنا وحده. */

const LANGUAGES = new Set(["Arabic", "English"]);
const EXPERIENCES = new Set(["quick", "relaxed"]);
const SAFE_SLUG = /^[a-z0-9_-]{1,80}$/i;

const bad = (error: string) =>
  Response.json({ error }, { status: 400 });

export async function GET(request: Request) {
  const accountSession = await getAccountFromCookie(request.headers.get("cookie") ?? "");
  if (!accountSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const { id: userId, name: userName } = accountSession.user;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: "Server misconfigured: LiveKit keys missing" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const courseId = url.searchParams.get("course_id") ?? "";
  const chapterId = url.searchParams.get("chapter_id") ?? "";
  const language = url.searchParams.get("language") ?? "Arabic";
  const experience = url.searchParams.get("experience") ?? "relaxed";

  if (!SAFE_SLUG.test(courseId)) return bad("invalid course_id");
  if (!SAFE_SLUG.test(chapterId)) return bad("invalid chapter_id");
  if (!LANGUAGES.has(language)) return bad("invalid language");
  if (!EXPERIENCES.has(experience)) return bad("invalid experience");

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    attributes: {
      course_id: courseId,
      chapter_id: chapterId,
      language,
      user_name: userName,
      user_id: userId,
      experience,
    },
  });

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;

  at.addGrant({
    roomJoin: true,
    room: `ss_${userId.slice(-10)}_${dateStr}_${timeStr}`,
  });

  return new Response(await at.toJwt(), {
    headers: { "Cache-Control": "no-store" },
  });
}
