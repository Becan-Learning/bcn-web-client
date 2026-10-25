// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../../../../messages/ar.json";
import en from "../../../../../messages/en.json";
import { SessionRating } from "./session-rating";

const nav = vi.hoisted(() => ({ replace: vi.fn(), fetch: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/c/math-101",
}));
vi.mock("@/components/becan/kit", () => ({
  PrimaryButton: ({ children, type, disabled }: ComponentProps<"button">) => <button type={type} disabled={disabled}>{children}</button>,
}));

const R = ar.SessionRating;
const stars = () => R.rating;

function setup(room: string | null = "ss_room", locale: "ar" | "en" = "ar") {
  const user = userEvent.setup();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">
      <SessionRating room={room} />
    </NextIntlClientProvider>,
  );
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", nav.fetch);
  nav.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
  window.history.replaceState(null, "", "/c/math-101?rate=ss_room&limit=1&x=2");
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("SessionRating card", () => {
  it("shows nothing without a room", () => {
    setup(null);
    expect(screen.queryByText(R.title)).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["ar", "en"] as const)("asks the question with five named stars and a close button in %s", (locale) => {
    const messages = (locale === "ar" ? ar : en).SessionRating;
    setup("ss_room", locale);
    const card = screen.getByRole("region", { name: messages.title });
    expect(within(card).getAllByRole("button")).toHaveLength(6);
    for (const label of Object.values(messages.rating)) expect(within(card).getByRole("button", { name: label })).toBeTruthy();
    expect(within(card).getByRole("button", { name: messages.close })).toBeTruthy();
    expect(card.className).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("announces the question politely once mounted", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe(R.title));
  });
});

describe("SessionRating dialog", () => {
  it("opens with the tapped star preselected, the notes field and the send button", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().good }));
    const dialog = await screen.findByRole("dialog", { name: R.title });
    expect(within(dialog).getAllByRole("radio")).toHaveLength(5);
    expect((within(dialog).getByRole("radio", { name: stars().good }) as HTMLInputElement).checked).toBe(true);
    expect(within(dialog).getByRole("group", { name: R.ratingLabel })).toBeTruthy();
    expect(within(dialog).getByLabelText(R.notes)).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: R.submit })).toBeTruthy();
    expect(dialog.getAttribute("data-theme")).toBe("light");
    expect(document.activeElement).toBe(within(dialog).getByRole("radio", { name: stars().good }));
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("lets the student change the star before sending", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().poor }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: stars().excellent }));
    await user.click(within(dialog).getByRole("button", { name: R.submit }));
    await waitFor(() => expect(nav.fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(nav.fetch.mock.calls[0][1].body).sessionExperience).toBe(5);
  });

  it("closes without sending back to the card, keeps the card in the URL, and keeps the typed notes", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().acceptable }));
    await user.type(await screen.findByLabelText(R.notes), "ملاحظتي");
    await user.click(screen.getByRole("button", { name: R.cancel }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("region", { name: R.title })).toBeTruthy();
    expect(nav.fetch).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: stars().bad }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText(R.notes) as HTMLTextAreaElement).value).toBe("ملاحظتي");
    expect((within(dialog).getByRole("radio", { name: stars().bad }) as HTMLInputElement).checked).toBe(true);
  });

  it("closes the dialog, not the card, on Escape", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().good }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("region", { name: R.title })).toBeTruthy();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("sends the same payload as before, then clears the rating params and removes the card", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().excellent }));
    await user.type(await screen.findByLabelText(R.notes), "شرح ممتاز");
    await user.click(screen.getByRole("button", { name: R.submit }));
    await waitFor(() => expect(nav.fetch).toHaveBeenCalledOnce());
    const [url, init] = nav.fetch.mock.calls[0];
    expect(url).toBe("/api/feedback");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ sessionId: "ss_room", sessionExperience: 5, notes: "شرح ممتاز" });
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/c/math-101?x=2", { scroll: false }));
    expect(nav.replace).toHaveBeenCalledOnce();
    /* الشكر يبقى في النافذة حتى يغلقها الطالب؛ البطاقة ذهبت. */
    const dialog = await screen.findByRole("dialog", { name: R.sent });
    expect(screen.queryByRole("region", { name: R.title })).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: R.close }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("region", { name: R.title })).toBeNull();
  });

  it("shows the error, keeps the card and the params, and allows another try", async () => {
    nav.fetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    const user = setup();
    await user.click(screen.getByRole("button", { name: stars().good }));
    await user.click(await screen.findByRole("button", { name: R.submit }));
    expect((await screen.findByRole("alert")).textContent).toBe(R.error);
    expect(nav.replace).not.toHaveBeenCalled();
    nav.fetch.mockRejectedValueOnce(new Error("offline"));
    await user.click(screen.getByRole("button", { name: R.submit }));
    await waitFor(() => expect(nav.fetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("alert")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: R.submit }));
    await screen.findByRole("dialog", { name: R.sent });
    expect(nav.replace).toHaveBeenCalledOnce();
  });
});

describe("SessionRating dismissal", () => {
  it("removes the card and the rating params, keeping other params, when closed", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: R.close }));
    expect(nav.replace).toHaveBeenCalledWith("/c/math-101?x=2", { scroll: false });
    expect(screen.queryByRole("region", { name: R.title })).toBeNull();
    expect(nav.fetch).not.toHaveBeenCalled();
  });

  it("goes to the bare course path when nothing else is in the URL", async () => {
    window.history.replaceState(null, "", "/c/math-101?rate=ss_room");
    const user = setup();
    await user.click(screen.getByRole("button", { name: R.close }));
    expect(nav.replace).toHaveBeenCalledWith("/c/math-101", { scroll: false });
  });

  it("dismisses on Escape inside the card", async () => {
    const user = setup();
    screen.getByRole("button", { name: stars().good }).focus();
    await user.keyboard("{Escape}");
    expect(nav.replace).toHaveBeenCalledOnce();
    expect(screen.queryByRole("region", { name: R.title })).toBeNull();
  });
});
