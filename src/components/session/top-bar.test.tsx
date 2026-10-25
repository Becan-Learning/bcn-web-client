import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { WHATSAPP } from "@/lib/data/support";
import { TopBar } from "./parts";

function render(locale: "ar" | "en", phase: "idle" | "cut" | "live") {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en} timeZone="UTC">
      <TopBar phase={phase} courseName="Calculus" chapterNo={3} onExit={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("TopBar support link", () => {
  it.each(["idle", "cut", "live"] as const)("opens WhatsApp in a new tab before the exit button in %s", (phase) => {
    const html = render("en", phase);
    const link = html.match(/<a [^>]*>/)?.[0] ?? "";
    expect(link).toContain(`href="https://wa.me/${WHATSAPP}?text=`);
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(link).toContain('aria-label="Contact support on WhatsApp"');
    expect(link).toContain('title="Contact support on WhatsApp"');
    expect(html.indexOf("<a ")).toBeLessThan(html.indexOf("<button"));
  });

  it("prefills the course and chapter number in both locales", () => {
    const text = (locale: "ar" | "en") =>
      decodeURIComponent(render(locale, "live").match(/href="[^"]*\?text=([^"]+)"/)?.[1] ?? "");
    expect(text("en")).toBe("Hello, I have a question during my session: Calculus, chapter 3");
    expect(text("ar")).toBe("السلام عليكم، عندي سؤال أثناء حصة Calculus — الفصل 3");
  });

  it("uses the same ghost sizing as the exit button", () => {
    const html = render("ar", "idle");
    const ghost = "h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-2 hover:bg-panel pointer-fine:md:h-8 pointer-fine:md:w-8";
    expect(html.split(ghost).length - 1).toBe(2);
  });
});
