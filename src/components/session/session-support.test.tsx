// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { WHATSAPP } from "@/lib/data/support";
import { SessionView } from "./session-view";

const live = vi.hoisted(() => ({ agentState: "disconnected", mobile: false }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("livekit-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("livekit-client")>(),
  TokenSource: { custom: (fetch: () => Promise<unknown>) => ({ fetch }) },
}));
vi.mock("@livekit/components-react", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  RoomAudioRenderer: () => null,
  useAudioWaveform: () => ({ bars: [] }),
  useTrackVolume: () => 0,
  useSession: () => ({
    start: vi.fn(),
    end: vi.fn(async () => {}),
    connectionState: "disconnected",
    isConnected: false,
    room: { name: "", on: vi.fn(), off: vi.fn(), localParticipant: {} },
    local: { microphoneTrack: null },
  }),
  useAgent: () => ({ state: live.agentState, isConnected: false, internal: {} }),
}));
vi.mock("./board/board", () => ({ Board: () => null }));
vi.mock("./use-packet-recorder", () => ({ PacketRecorderButtons: () => null, usePacketRecorder: () => ({ record: vi.fn() }) }));

const lessons = [{ slug: "l1", name: "الأول", brief: "" }];

function mount(locale: "ar" | "en" = "ar") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">
      <SessionView courseName="Calculus" courseSlug="calc" chapterNo={3} chapterTitle="الأول"
        minutes={30} content={{ courseId: "calc", chapterId: "ch_3" }} pdfUrl="/s.pdf"
        lessons={lessons} minutesRemaining={null} />
    </NextIntlClientProvider>,
  );
}

const hint = () => screen.queryByText(ar.Session.supportHint);

beforeEach(() => {
  live.agentState = "disconnected";
  live.mobile = false;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: live.mobile && query.includes("max-width"),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Connection lost screen", () => {
  it("reloads the page from the primary button, always labelled 'try again'", async () => {
    live.agentState = "failed";
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    mount();
    const retry = screen.getByRole("button", { name: ar.Session.retry });
    expect(screen.queryByText("كمّل من وين وقفت")).toBeNull();
    await userEvent.setup().click(retry);
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe("Support entry in the session", () => {
  it("shows the hint on the top-bar icon on load and hides it after 3 seconds", () => {
    vi.useFakeTimers();
    mount();
    const bubble = hint()!;
    expect(bubble).not.toBeNull();
    expect(bubble.getAttribute("aria-hidden")).toBe("true");
    expect(bubble.className).toContain("pointer-events-none");
    expect(bubble.className).not.toContain("animate-");
    // the hint belongs to the top-bar support link while the lessons panel is closed
    expect(bubble.parentElement).toBe(screen.getByRole("link", { name: ar.Session.supportLabel }).parentElement);
    act(() => { vi.advanceTimersByTime(2_999); });
    expect(hint()).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(hint()).toBeNull();
  });

  it("puts a separate support card with the same context link under the desktop lessons panel and moves the hint to it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mount("en");
    const text = en.Session.supportHint;
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getAllByRole("button", { name: en.Session.openLessonsList })[0]);
    const card = screen.getByRole("link", { name: en.Session.supportCard });
    const topBar = screen.getByRole("link", { name: en.Session.supportLabel });
    expect(card.getAttribute("href")).toBe(topBar.getAttribute("href"));
    expect(card.getAttribute("href")).toContain(`https://wa.me/${WHATSAPP}?text=`);
    expect(card.getAttribute("target")).toBe("_blank");
    expect(card.getAttribute("rel")).toBe("noopener noreferrer");
    // a sibling box of the lessons list, not inside it
    expect(card.closest("ol")).toBeNull();
    expect(card.parentElement!.className).toContain("border-line");
    // one hint only, pointing at the card
    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(card.parentElement!.contains(screen.getByText(text))).toBe(true);
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(screen.queryByText(text)).toBeNull();
  });

  it("keeps the top-bar icon when the lessons panel is open", async () => {
    mount();
    await userEvent.setup().click(screen.getAllByRole("button", { name: ar.Session.openLessonsList })[0]);
    expect(screen.getByRole("link", { name: ar.Session.supportLabel })).not.toBeNull();
  });

  it("shows the support card inside the mobile lessons sheet", async () => {
    live.mobile = true;
    mount();
    expect(screen.queryByRole("link", { name: ar.Session.supportCard })).toBeNull();
    await userEvent.setup().click(screen.getAllByRole("button", { name: ar.Session.openLessonsList })[0]);
    const card = await screen.findByRole("link", { name: ar.Session.supportCard });
    expect(card.getAttribute("href")).toContain(`https://wa.me/${WHATSAPP}?text=`);
    expect(card.getAttribute("href")).toContain(encodeURIComponent("Calculus"));
  });
});
