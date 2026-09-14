import type { Metadata } from "next";
import { BecanFace } from "@/components/becan/becan-face";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { JoinForm } from "./join-form";
import { PageShell, SiteHeader } from "@/components/becan/kit";

export const metadata: Metadata = {
  title: "سجّل دخولك — بيكان",
  description: "ادخل وارجع إلى نفس الفصل الذي كنت فيه.",
};

export default async function JoinPage(props: PageProps<"/join">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || "";

  const course = one(sp.course);
  const chapter = one(sp.chapter);
  const next = one(sp.next);

  /* سطر السياق إلزامي في البريف — يبقى ظاهرًا حتى بلا معاملات،
     فلو دخل الطالب مباشرة عرف ماذا يفتح له التسجيل. */
  const unlocks = [course, chapter && `الفصل ${chapter}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell withFooter>
      <SiteHeader minimal />

      {/* بطاقة متمركزة على الكمبيوتر لا عمودًا يمتدّ عرض الصفحة:
          الشاشة مهمّة واحدة قصيرة، والبطاقة تحصرها فلا تتشتّت العين
          في فراغ حولها. وعلى الجوال تسقط حدود البطاقة — الشاشة
          الضيّقة تحصرها أصلًا، وإطار داخل إطار حشو. */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 md:px-8 md:py-14">
        <div className="w-full max-w-[27rem] md:rounded-xl md:border md:border-line md:bg-surface md:p-8 md:shadow-soft">
          <div className="flex items-center gap-3">
            <BecanFace className="w-20 shrink-0" />
            {/* سطر واحد لا يلتفّ: البطاقة ضيّقة والعنوان كلمتان،
                فالالتفاف يقطعهما بلا داعٍ. */}
            <TypedHeadline
              size="card"
              prefix="سجّل"
              word="دخولك"
              className="mt-0 whitespace-nowrap"
            />
          </div>

          <p className="mt-5 rounded-xl border border-aubergine-mid bg-tint-aubergine px-4 py-3 text-ink">
            {unlocks ? (
              <>
                <span className="font-semibold">تسجيلك يفتح: </span>
                {unlocks}
              </>
            ) : (
              <span className="font-semibold">
                تسجيلك يفتح مقررك من حيث وقفت
              </span>
            )}
          </p>

          <JoinForm next={next} />
        </div>
      </main>
    </PageShell>
  );
}
