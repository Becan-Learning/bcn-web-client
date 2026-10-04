import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { BoardHarness } from "./board-harness";

/* عدّة فحص السبورة — للمطوّر لا للطالب. تُغلق في الإنتاج ما لم يُفتح
   `NEXT_PUBLIC_BOARD_HARNESS=1` صراحةً. عنوان الصفحة إنجليزي ثابت لأنها
   أداة تطوير، وهو استثناء موثّق من قاعدة `messages/`. */

export const metadata: Metadata = {
  title: "Board harness",
  robots: { index: false, follow: false },
};

export default async function BoardHarnessPage(props: PageProps<"/[locale]/dev/board">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_BOARD_HARNESS !== "1"
  ) {
    notFound();
  }
  setRequestLocale(locale);

  return <BoardHarness />;
}
