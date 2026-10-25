import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../messages/ar.json";
import { SessionView } from "./session-view";

const controls = vi.hoisted(() => ({
  primary: (() => {}) as () => void,
  refresh: vi.fn(),
  fetch: vi.fn(),
  publish: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh: controls.refresh }) }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("livekit-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("livekit-client")>(),
  TokenSource: { custom: (fetch: () => Promise<unknown>) => ({ fetch }) },
  createLocalAudioTrack: async () => ({ mute: async () => {}, stop: controls.stop }),
}));
vi.mock("@livekit/components-react", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  RoomAudioRenderer: () => null,
  useSession: (source: { fetch: () => Promise<unknown> }) => ({
    start: source.fetch,
    connectionState: "disconnected",
    isConnected: false,
    room: { localParticipant: { publishTrack: controls.publish } },
    local: { microphoneTrack: null },
  }),
  useAgent: () => ({ state: "disconnected", isConnected: false, internal: {} }),
}));
vi.mock("./board/board", () => ({ Board: ({ intro }: { intro: ReactNode }) => <div data-intro="">{intro}</div> }));
vi.mock("./use-packet-recorder", () => ({ PacketRecorderButtons: () => null, usePacketRecorder: () => ({ record: vi.fn() }) }));
vi.mock("./parts", () => ({
  TopBar: () => null, ChatPanel: () => null, EndSessionDialog: () => null,
  LanguageChoice: () => <div data-language-choice="" />, CheckpointDialog: () => null, RotateNotice: () => null,
  SlidesMessage: () => null, TopicsRail: () => null, TopicsSheet: () => null, TopicsTrack: () => null,
  Toolbar: ({ onPrimary }: { onPrimary: () => void }) => { controls.primary = onPrimary; return null; },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", controls.fetch);
  controls.publish.mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function render(minutesRemaining: number | null = null) {
  return renderToStaticMarkup(<NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
    <SessionView courseName="الرياضيات" courseSlug="math-101" chapterNo={1} chapterTitle="الأول"
      minutes={30} content={{ courseId: "math-101", chapterId: "ch_1" }} pdfUrl="/slides.pdf" lessons={[]} minutesRemaining={minutesRemaining} />
  </NextIntlClientProvider>);
}

describe("Token refusal at session start", () => {
  it("places the remaining minutes directly after duration and before the explanation-language choice", () => {
    const html = render(13);
    const intro = html.match(/<div data-intro="">(.*?)<\/div><\/div>/)![1];
    expect(intro).toMatch(/<\/p><p class="mt-2 max-w-measure text-sm leading-base text-ink-2">باقي لك 13 دقيقةً في دورة الاستخدام هذي<\/p><div data-language-choice="">/);
    expect(html.match(/باقي لك/g)).toHaveLength(1);
    expect(html).not.toContain("mb-10");
  });

  it("does not request a token on the pre-start screen", () => {
    render();
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it.each(["SESSIONS_USED_UP", "MINUTES_USED_UP"])("refreshes the server gate for 403 %s and stops the microphone", async (code) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    controls.fetch.mockResolvedValue(new Response(JSON.stringify({ error: { code, message: "Refused" } }), { status: 403 }));
    render();
    controls.primary();
    await vi.waitFor(() => expect(controls.refresh).toHaveBeenCalledOnce());
    expect(controls.stop).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
    expect(controls.fetch).toHaveBeenCalledWith("/api/v1/livekit/token", expect.objectContaining({ method: "POST", cache: "no-store" }));
  });

  it.each([
    [403, JSON.stringify({ error: { code: "NOT_ENROLLED", message: "Refused" } })],
    [409, JSON.stringify({ error: { code: "MINUTES_USED_UP", message: "Refused" } })],
    [500, "Not JSON"],
  ])("keeps other failures on today's connection failure path (%i)", async (status, body) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    controls.fetch.mockResolvedValue(new Response(body, { status }));
    render();
    controls.primary();
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("Failed to start session:", expect.any(Error)));
    expect(controls.refresh).not.toHaveBeenCalled();
    expect(controls.stop).toHaveBeenCalledOnce();
  });
});
