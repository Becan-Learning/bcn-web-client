import type { Metadata } from "next";
import { BecanFace } from "@/components/becan/becan-face";
import { studentsLabel } from "@/lib/data/catalog";
import { ShareButton } from "./share-button";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { PageShell, PrimaryButton, Section, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "وصلنا طلبك — بيكان",
  description: "نبلّغك على واتساب أول ما يجهز المقرر.",
};

/* عدد الطلاب الذين طلبوا نفس المقرر — بيانات عرض حتى يصل العدّاد الحقيقي. */
const PEERS = 8;

export default async function RequestSentPage(
  props: PageProps<"/request/sent">,
) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || "";

  const course = one(sp.course);
  const university = one(sp.university);
  const subject = [course, university].filter(Boolean).join(" — ");

  return (
    <PageShell withFooter>
      <SiteHeader />

      <Section className="pt-12 pb-16 md:pt-20">
        {/* 1 — الشارة: الطلب ليس وحيدًا، وهذا ما يبقي الطالب */}
        {subject ? (
          <p className="inline-flex flex-wrap items-center gap-2 rounded-pill bg-tint-amber px-4 py-2 text-sm font-semibold text-ink">
            <span>{studentsLabel(PEERS)}</span>
            <span className="text-ink-2">«{subject}»</span>
          </p>
        ) : null}

        {/* 2 — العنوان والجملة */}
        <div className="mt-5 flex items-center gap-4">
          <BecanFace className="w-24 shrink-0 md:w-32" />
          <TypedHeadline prefix="وصلنا" word="طلبك" className="mt-0" />
        </div>

        <p className="mt-6 max-w-measure text-lg leading-relaxed text-ink-2">
          نبلّغك على واتساب أول ما يجهز المقرر.
          <br />
          كل طلب جديد يرفع أولويتها في قائمة الإنتاج.
        </p>

        {/* 3 — مخرجان، كلاهما يبقيه داخل بيكان.
            «جرّب مقررًا آخر» هو الافتراضي: يعيده إلى المنتج فورًا،
            والمشاركة تحته لأنها فعل مؤجَّل. */}
        <div className="mt-9 flex max-w-measure flex-col gap-4">
          <PrimaryButton href="/courses" className="w-full sm:w-fit">
            جرّب مقررًا آخر
          </PrimaryButton>
          <ShareButton
            text={
              subject
                ? `طلبت «${subject}» على بيكان. اطلبها معي وترتفع أولويتها.`
                : "طلبت مقرري على بيكان. اطلب مقررك وترتفع أولويته."
            }
          />
        </div>
      </Section>
    </PageShell>
  );
}
