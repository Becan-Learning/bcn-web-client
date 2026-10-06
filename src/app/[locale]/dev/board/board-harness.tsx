"use client";

import { useEffect, useId, useMemo, useState } from "react";
import fixtureFile from "@/lib/session/board/__fixtures__/board-fixtures.json";
import {
  canDuplicateNext,
  canReplaySnapshot,
  canSwapNext,
  canUseUnknownIcon,
  createPlayer,
  duplicateNext,
  isFinished,
  parseHarnessInput,
  playAll,
  replaySnapshotAtEqualRev,
  resetPlayer,
  step,
  swapNext,
  withUnknownIcon,
  type HarnessFixture,
  type Player,
} from "@/lib/session/board/harness";
import { Board } from "@/components/session/board/board";
import type { ExplanationLanguage } from "@/components/session/explanation-language";

/* عدّة فحص السبورة: تشغّل أي تجهيز، أو تسجيلًا حيًّا مستوردًا، على
   `Board` الحقيقي وبمخفّض الجلسة الحقيقي داخل سطح الجلسة الداكن.

   كل نصوصها إنجليزية ثابتة — أداة تطوير لا واجهة طالب، فهي استثناء
   موثّق من قاعدة `messages/`. واتجاه الإطار يتبع لغة المسار، أما اتجاه
   السبورة فتحدّده لغة الشرح المختارة هنا.

   نقاط التكسّر في السبورة (md) تتبع نافذة المتصفّح لا عرض الإطار؛
   فالإطاران 320 و390 يقيسان ضيق العمود، ولفحص قواعد الجوال الرأسي
   تُضيَّق النافذة نفسها. */

type Width = "320" | "390" | "full";

const FIXTURES = fixtureFile.fixtures as HarnessFixture[];

const WIDTHS: { value: Width; label: string; className: string }[] = [
  { value: "320", label: "320", className: "w-[320px]" },
  { value: "390", label: "390", className: "w-[390px]" },
  { value: "full", label: "Full", className: "w-full" },
];

const LANGUAGES: { value: ExplanationLanguage; label: string }[] = [
  { value: "Arabic", label: "Arabic · RTL" },
  { value: "English", label: "English · LTR" },
];

const INTERVALS = [400, 800, 1500, 3000];

const button =
  "inline-flex min-h-11 items-center justify-center rounded-pill border border-line px-4 text-sm font-semibold text-ink aria-pressed:border-ink aria-pressed:bg-surface disabled:pointer-events-none disabled:opacity-50";
const primary =
  "inline-flex min-h-11 items-center justify-center rounded-pill bg-pressable px-5 text-sm font-semibold text-on-pressable disabled:pointer-events-none disabled:opacity-50";
const field =
  "min-h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink";

function summarize(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return String(raw);
  const packet = raw as Record<string, unknown>;
  const rev = typeof packet.rev === "number" ? ` · rev ${packet.rev}` : "";
  const id = typeof packet.id === "string" ? ` · ${packet.id}` : "";
  return `${typeof packet.action === "string" ? packet.action : "?"}${rev}${id}`;
}

function Json({ value, label }: { value: unknown; label: string }) {
  return (
    <pre
      dir="ltr"
      tabIndex={0}
      aria-label={label}
      className="max-h-48 overflow-auto rounded-md border border-line bg-surface p-3 text-start text-xs leading-base text-ink-2"
    >
      {value === undefined ? "—" : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Fact({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
      <dt className="text-ink-2">{name}</dt>
      <dd dir="auto" className="min-w-0 text-end font-semibold break-words text-ink">
        {children}
      </dd>
    </div>
  );
}

export function BoardHarness() {
  const ids = useId();
  const [catalogue, setCatalogue] = useState<HarnessFixture[]>(FIXTURES);
  const [selected, setSelected] = useState(0);
  const [player, setPlayer] = useState<Player>(() => createPlayer(FIXTURES[0].messages));
  const [language, setLanguage] = useState<ExplanationLanguage>("Arabic");
  const [width, setWidth] = useState<Width>("390");
  const [reduce, setReduce] = useState(false);
  const [auto, setAuto] = useState(false);
  const [interval, setIntervalMs] = useState(800);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [importError, setImportError] = useState<string | null>(null);
  const [showState, setShowState] = useState(false);

  const fixture = catalogue[selected];
  const finished = isFinished(player);
  const running = auto && !finished;

  /* المؤقّت من العدّة وحدها: المخفّض لا يعرف زمنًا */
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setPlayer((p) => step(p)), interval);
    return () => window.clearInterval(timer);
  }, [running, interval]);

  const statuses = useMemo(
    () => ["all", ...new Set(catalogue.map((f) => f.status))],
    [catalogue],
  );

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalogue
      .map((f, index) => ({ f, index }))
      .filter(
        ({ f }) =>
          (status === "all" || f.status === status) &&
          (!needle ||
            `${f.name} ${f.description} ${f.covers.join(" ")}`.toLowerCase().includes(needle)),
      );
  }, [catalogue, query, status]);

  const choose = (index: number) => {
    setSelected(index);
    setPlayer(createPlayer(catalogue[index].messages));
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseHarnessInput(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImportError(null);
    setCatalogue((current) => [...current, ...result.fixtures]);
    setSelected(catalogue.length);
    setPlayer(createPlayer(result.fixtures[0].messages));
  };

  const { session, packets, cursor, log } = player;
  const board = session.board;
  const edited = packets !== player.source;
  const last = cursor > 0 ? packets[cursor - 1] : undefined;
  const next = packets[cursor];
  const upcoming = packets.slice(cursor, cursor + 6);
  const frame = WIDTHS.find((w) => w.value === width) ?? WIDTHS[1];

  return (
    <div
      data-theme="dark"
      data-surface="session"
      lang="en"
      className="min-h-dvh bg-ground p-3 text-ink md:p-5"
    >
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Board harness</h1>
        <p className="mt-1 max-w-measure text-sm leading-base text-ink-2">
          Plays contract fixtures and recorded sessions through the real parser, session reducer
          and board. Fault injection edits the in-memory queue only.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* ————— اختيار التجهيز ————— */}
        <section aria-labelledby={`${ids}-fixtures`} className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h2 id={`${ids}-fixtures`} className="text-lg font-bold text-ink">
            Fixtures ({shown.length} of {catalogue.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="search"
              aria-label="Filter fixtures"
              placeholder="Filter by name or covers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${field} min-w-0 flex-1`}
            />
            <select
              aria-label="Fixture status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={field}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-2 max-h-80 overflow-y-auto rounded-md border border-line">
            {shown.map(({ f, index }) => (
              <li key={`${f.name}-${index}`} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-current={index === selected ? "true" : undefined}
                  onClick={() => choose(index)}
                  className="block min-h-11 w-full px-3 py-2 text-start aria-[current=true]:bg-surface"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span dir="ltr" className="min-w-0 font-semibold break-all text-ink">
                      {f.name}
                    </span>
                    <span className="shrink-0 rounded-pill border border-line px-2 text-xs text-ink-2">
                      {f.status}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-base text-ink-2">
                    {f.description}
                  </span>
                  {f.covers.length > 0 ? (
                    <span dir="ltr" className="mt-1 block text-xs text-ink-3">
                      {f.covers.join(" · ")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <label className={`${button} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2`}>
              Import recorded JSON
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {importError ? (
              <p role="alert" className="mt-2 text-sm text-error">
                {importError}
              </p>
            ) : null}
          </div>
        </section>

        {/* ————— التشغيل والسبورة ————— */}
        <main className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <section aria-label="Playback" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={primary}
              disabled={finished}
              onClick={() => setPlayer(step)}
            >
              Step
            </button>
            <button
              type="button"
              className={button}
              disabled={finished}
              onClick={() => setPlayer(playAll)}
            >
              Play all
            </button>
            <button type="button" className={button} onClick={() => setPlayer(resetPlayer)}>
              Reset
            </button>
            <button
              type="button"
              className={button}
              aria-pressed={running}
              disabled={finished}
              onClick={() => setAuto((v) => !v)}
            >
              {running ? "Stop auto" : "Auto-step"}
            </button>
            <select
              aria-label="Auto-step interval"
              value={interval}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className={field}
            >
              {INTERVALS.map((ms) => (
                <option key={ms} value={ms}>
                  {ms} ms
                </option>
              ))}
            </select>
            <span className="text-sm text-ink-2" aria-live="polite">
              {cursor} / {packets.length}
              {edited ? " · queue edited" : ""}
            </span>
          </section>

          <section aria-label="View" className="mt-3 flex flex-wrap items-center gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                className={button}
                aria-pressed={language === l.value}
                onClick={() => setLanguage(l.value)}
              >
                {l.label}
              </button>
            ))}
            <span aria-hidden className="mx-1 h-6 border-s border-line" />
            {WIDTHS.map((w) => (
              <button
                key={w.value}
                type="button"
                className={button}
                aria-pressed={width === w.value}
                onClick={() => setWidth(w.value)}
              >
                {w.label}
              </button>
            ))}
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={reduce}
                onChange={(e) => setReduce(e.target.checked)}
                className="size-4"
              />
              Reduce motion
            </label>
          </section>

          <section aria-label="Fault injection" className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={button}
              disabled={!canDuplicateNext(player)}
              onClick={() => setPlayer(duplicateNext)}
            >
              Duplicate next
            </button>
            <button
              type="button"
              className={button}
              disabled={!canSwapNext(player)}
              onClick={() => setPlayer(swapNext)}
            >
              Swap next two
            </button>
            <button
              type="button"
              className={button}
              disabled={!canReplaySnapshot(player)}
              onClick={() => setPlayer(replaySnapshotAtEqualRev)}
            >
              Replay snapshot at equal rev
            </button>
            <button
              type="button"
              className={button}
              disabled={!canUseUnknownIcon(player)}
              onClick={() => setPlayer(withUnknownIcon)}
            >
              Unknown icon name
            </button>
          </section>

          <div className="mt-4 overflow-x-auto">
            <div className={`${frame.className} max-w-full`}>
              <div className="relative flex h-[34rem] max-h-[75dvh] flex-col">
                <Board
                  board={board}
                  speaking={false}
                  reduce={reduce}
                  language={language}
                  intro={
                    <p className="text-ink-2">
                      Nothing on the board yet. Step the first packet of {fixture.name}.
                    </p>
                  }
                />
              </div>
            </div>
          </div>
        </main>

        {/* ————— القراءة ————— */}
        <section aria-labelledby={`${ids}-readout`} className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 id={`${ids}-readout`} className="text-lg font-bold text-ink">
            Readout
          </h2>
          <dl className="mt-2 text-sm">
            <Fact name="Fixture">
              <span dir="ltr">{fixture.name}</span>
            </Fact>
            <Fact name="Board rev">{board.rev}</Fact>
            <Fact name="Out of sync">
              <span className={board.diverged ? "text-error" : undefined}>
                {board.diverged ? "yes" : "no"}
              </span>
            </Fact>
            <Fact name="Visible">{board.visible ? "yes" : "no"}</Fact>
            <Fact name="Items · groups">
              {board.items.length} · {board.groups.length}
            </Fact>
            <Fact name="Lesson">
              {session.lesson
                ? `${session.lesson.slug} (${session.lesson.totalTopics} topics)`
                : "—"}
            </Fact>
            <Fact name="Topic">
              {session.topic ? `${session.topic.index} · ${session.topic.name}` : "—"}
            </Fact>
            <Fact name="Completed lessons">
              {session.completedLessons.length > 0 ? session.completedLessons.join(", ") : "—"}
            </Fact>
            <Fact name="Slide">{session.page ?? "—"}</Fact>
            <Fact name="Checkpoint">
              {session.checkpoint
                ? `${session.checkpoint.id}: ${session.checkpoint.question} [${session.checkpoint.choices.join(" | ")}]`
                : "—"}
            </Fact>
            <Fact name="Handled checkpoint">{session.handledCheckpointId ?? "—"}</Fact>
            <Fact name="Ending">{session.ending ? "yes" : "no"}</Fact>
          </dl>

          <h3 className="mt-4 text-sm font-bold text-ink">Last applied</h3>
          <Json value={last} label="Last applied packet" />
          <h3 className="mt-3 text-sm font-bold text-ink">Next</h3>
          <Json value={next} label="Next packet" />

          <h3 className="mt-3 text-sm font-bold text-ink">Upcoming queue</h3>
          <ol dir="ltr" className="mt-1 text-xs leading-base text-ink-2">
            {upcoming.length === 0 ? <li>—</li> : null}
            {upcoming.map((raw, i) => (
              <li key={cursor + i}>
                {cursor + i + 1}. {summarize(raw)}
              </li>
            ))}
          </ol>

          <h3 className="mt-3 text-sm font-bold text-ink">Applied log</h3>
          <ol
            dir="ltr"
            tabIndex={0}
            aria-label="Applied packet log"
            className="mt-1 max-h-48 overflow-auto rounded-md border border-line p-2 text-xs leading-base text-ink-2"
          >
            {log.length === 0 ? <li>—</li> : null}
            {log.map((entry) => (
              <li key={entry.index}>
                {entry.index + 1}. {entry.action ?? "?"}
                {entry.rev !== null ? ` r${entry.rev}` : ""} · {entry.effect} → rev {entry.boardRev}
                {entry.diverged ? " · out of sync" : ""}
              </li>
            ))}
          </ol>

          <details
            className="mt-3"
            onToggle={(e) => setShowState(e.currentTarget.open)}
          >
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-bold text-ink">
              Board state JSON
            </summary>
            {showState ? <Json value={board} label="Board state" /> : null}
          </details>
        </section>
      </div>
    </div>
  );
}
