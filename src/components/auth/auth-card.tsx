import { BecanFace } from "@/components/becan/becan-face";
import { TypedHeadline } from "@/components/becan/typed-headline";
import { PageShell, SiteHeader } from "@/components/becan/kit";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [prefix, word, suffix] = title.split("\0");
  return (
    <PageShell withFooter>
      <SiteHeader minimal />
      <main className="flex flex-1 items-center justify-center px-4 py-10 md:px-8 md:py-14">
        <div className="w-full max-w-[27rem] md:rounded-xl md:border md:border-line md:bg-surface md:p-8 md:shadow-soft">
          <div className="flex items-center gap-3">
            <BecanFace className="w-20 shrink-0" />
            <TypedHeadline
              size="card"
              prefix={prefix.trimEnd()}
              word={word}
              suffix={suffix}
              className="mt-0 min-w-0"
            />
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </PageShell>
  );
}
