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

const live = vi.hoisted(() => ({ agentState: "disconnected", mobile: false, portrait: false }));
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
  live.portrait = false;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("orientation") ? live.mobile && live.portrait : live.mobile && query.includes("max-width"),
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
  const topBarLink = (name: string) => screen.getAllByRole("link", { name })[0];

  it("shows the hint on the desktop rail's support box on load and hides it after 3 seconds", () => {
    vi.useFakeTimers();
    mount();
    const bubble = hint()!;
    expect(bubble).not.toBeNull();
    const wrapper = bubble.closest('[aria-hidden="true"]')!;
    expect(wrapper.className).toContain("pointer-events-none");
    expect(wrapper.innerHTML).not.toContain("animate-");
    // the rail is visible, so the bubble belongs to its box and not to the top-bar icon
    const [topBar, rail] = screen.getAllByRole("link", { name: ar.Session.supportLabel });
    expect(rail.parentElement!.contains(bubble)).toBe(true);
    expect(topBar.parentElement!.contains(bubble)).toBe(false);
    act(() => { vi.advanceTimersByTime(2_999); });
    expect(hint()).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(hint()).toBeNull();
  });

  it("puts the support box under the rail with the same container classes and the same context link", () => {
    mount("en");
    const [topBar, rail] = screen.getAllByRole("link", { name: en.Session.supportLabel });
    expect(rail.getAttribute("href")).toBe(topBar.getAttribute("href"));
    expect(rail.getAttribute("href")).toContain(`https://wa.me/${WHATSAPP}?text=`);
    expect(rail.getAttribute("target")).toBe("_blank");
    expect(rail.getAttribute("rel")).toBe("noopener noreferrer");
    const box = rail.parentElement!;
    const railSection = box.previousElementSibling!;
    expect(railSection.tagName).toBe("SECTION");
    for (const cls of ["rounded-xl", "border", "border-line", "bg-panel", "w-16"]) {
      expect(box.classList.contains(cls)).toBe(true);
      expect(railSection.classList.contains(cls)).toBe(true);
    }
    expect(box.textContent).toContain(en.Session.supportShort);
  });

  it("keeps the support box when the lessons dropdown opens, and the dropdown holds only the lessons", async () => {
    mount();
    await userEvent.setup().click(screen.getAllByRole("button", { name: ar.Session.openLessonsList })[0]);
    const links = screen.getAllByRole("link", { name: ar.Session.supportLabel });
    expect(links).toHaveLength(2);
    expect(screen.queryByRole("link", { name: ar.Session.supportCard })).toBeNull();
  });

  it("moves the hint to the top-bar icon when the rail is hidden", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mount();
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByRole("button", { name: ar.Session.lessons }));
    const links = screen.getAllByRole("link", { name: ar.Session.supportLabel });
    expect(links).toHaveLength(1);
    expect(links[0].parentElement!.contains(hint())).toBe(true);
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(hint()).toBeNull();
  });

  it("puts the hint on the top-bar icon on mobile while the lessons sheet is closed", () => {
    live.mobile = true;
    mount();
    expect(topBarLink(ar.Session.supportLabel).parentElement!.contains(hint())).toBe(true);
  });

  it("shows the support card inside the mobile lessons sheet and points the hint at it", async () => {
    live.mobile = true;
    mount();
    expect(screen.queryByRole("link", { name: ar.Session.supportCard })).toBeNull();
    await userEvent.setup().click(screen.getAllByRole("button", { name: ar.Session.openLessonsList })[0]);
    const card = await screen.findByRole("link", { name: ar.Session.supportCard });
    expect(card.getAttribute("href")).toContain(`https://wa.me/${WHATSAPP}?text=`);
    expect(card.getAttribute("href")).toContain(encodeURIComponent("Calculus"));
    expect(card.parentElement!.contains(hint())).toBe(true);
  });

  it("starts the 3 seconds only once the rotate notice no longer covers the hint", async () => {
    live.mobile = true;
    live.portrait = true;
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mount();
    expect(screen.getByRole("dialog")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(hint()).toBeNull();
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByRole("button", { name: ar.Session.okay }));
    expect(hint()).not.toBeNull();
    act(() => { vi.advanceTimersByTime(2_900); });
    expect(hint()).not.toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(hint()).toBeNull();
  });
});
