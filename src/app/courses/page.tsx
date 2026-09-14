import type { Metadata } from "next";
import { Finder } from "./finder";
import { PageShell, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "وش مقررك؟ — بيكان",
  description: "ابحث عن مقررك باسمه أو رمزه وابدأ الشرح من أول فصل.",
};

export default function CoursesPage() {
  return (
    <PageShell withFooter>
      <SiteHeader />
      <Finder />
    </PageShell>
  );
}
