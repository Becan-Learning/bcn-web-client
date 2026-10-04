import {
  INITIAL_SESSION_STATE,
  parseAgentMessage,
  sessionReducer,
  type SessionState,
} from "../session-reducer";

/* منطق عدّة الفحص نقيّ كله: طابور رسائل يُطبَّق رسالةً رسالة على
   `sessionReducer` الحقيقي بعد `parseAgentMessage`، لا على مخفّض السبورة
   مباشرة — فتتصرّف رسائل التقدّم في الدرس كما تتصرّف في الجلسة.

   حقن الأعطال يغيّر الطابور في الذاكرة وحده؛ ما حُمّل من الملف لا يُمسّ. */

/** صيغة الجهاز في ملف التجهيزات، وهي نفسها صيغة التسجيل المصدَّر */
export type HarnessFixture = {
  name: string;
  status: string;
  description: string;
  covers: string[];
  messages: unknown[];
  /** تسجيل حيّ فقط: ترتيب الوصول والحالة الناتجة عند كل رسالة */
  arrivals?: Arrival[];
};

export type Arrival = {
  order: number;
  at: string;
  action: string | null;
  rev: number | null;
  /** مراجعة السبورة بعد تطبيق الرسالة */
  boardRev: number;
  diverged: boolean;
};

export type LogEntry = {
  index: number;
  action: string | null;
  rev: number | null;
  /** رفضها المحلّل: لا تصل المخفّض أصلًا */
  effect: "applied" | "ignored" | "unrecognised";
  boardRev: number;
  diverged: boolean;
};

export type Player = {
  /** الطابور الأصلي كما حُمّل — إليه يعود الضبط */
  source: readonly unknown[];
  /** الطابور الحالي بعد الحقن */
  packets: readonly unknown[];
  /** عدد الرسائل المطبَّقة */
  cursor: number;
  session: SessionState;
  log: LogEntry[];
};

export const UNKNOWN_ICON_NAME = "unknown_icon_probe";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function actionOf(raw: unknown): string | null {
  return isRecord(raw) && typeof raw.action === "string" ? raw.action : null;
}

function revOf(raw: unknown): number | null {
  return isRecord(raw) && typeof raw.rev === "number" && Number.isFinite(raw.rev)
    ? raw.rev
    : null;
}

/** رسالة واحدة: الحالة الناتجة وأثرها، دون أن يرمي شيء مهما كان الشكل */
export function applyPacket(
  session: SessionState,
  raw: unknown,
  index: number,
): { session: SessionState; entry: LogEntry } {
  const message = parseAgentMessage(raw);
  const next = message ? sessionReducer(session, message) : session;
  return {
    session: next,
    entry: {
      index,
      action: actionOf(raw),
      rev: revOf(raw),
      effect: !message ? "unrecognised" : next === session ? "ignored" : "applied",
      boardRev: next.board.rev,
      diverged: next.board.diverged,
    },
  };
}

/** تشغيل مباشر كامل من حالة الجلسة الأولى — مرجع المقارنة للطابور */
export function replay(packets: readonly unknown[]): { session: SessionState; log: LogEntry[] } {
  let session = INITIAL_SESSION_STATE;
  const log: LogEntry[] = [];
  packets.forEach((raw, index) => {
    const applied = applyPacket(session, raw, index);
    session = applied.session;
    log.push(applied.entry);
  });
  return { session, log };
}

export function createPlayer(packets: readonly unknown[]): Player {
  return {
    source: packets,
    packets,
    cursor: 0,
    session: INITIAL_SESSION_STATE,
    log: [],
  };
}

export function isFinished(player: Player): boolean {
  return player.cursor >= player.packets.length;
}

export function step(player: Player): Player {
  if (isFinished(player)) return player;
  const applied = applyPacket(player.session, player.packets[player.cursor], player.cursor);
  return {
    ...player,
    cursor: player.cursor + 1,
    session: applied.session,
    log: [...player.log, applied.entry],
  };
}

/** كل ما بقي دفعة واحدة — لا مؤقّت في المخفّض يبطّئها */
export function playAll(player: Player): Player {
  let next = player;
  while (!isFinished(next)) next = step(next);
  return next;
}

/** يعود إلى الطابور الأصلي فيمحو ما حُقن */
export function resetPlayer(player: Player): Player {
  return createPlayer(player.source);
}

/* ————— حقن الأعطال —————
   كلها تعمل على ما لم يُطبَّق بعد (من المؤشّر فصاعدًا)، وتنسخ ما تغيّره
   فلا يتبدّل كائن في الملف الأصلي. */

function withPackets(player: Player, packets: unknown[]): Player {
  return { ...player, packets };
}

export function canDuplicateNext(player: Player): boolean {
  return !isFinished(player);
}

/** يكرّر الرسالة التالية فتصل مرّتين متتاليتين */
export function duplicateNext(player: Player): Player {
  if (!canDuplicateNext(player)) return player;
  const packets = [...player.packets];
  packets.splice(player.cursor + 1, 0, structuredClone(packets[player.cursor]));
  return withPackets(player, packets);
}

export function canSwapNext(player: Player): boolean {
  return player.cursor + 1 < player.packets.length;
}

/** يبدّل الرسالتين التاليتين فتصل الثانية أولًا */
export function swapNext(player: Player): Player {
  if (!canSwapNext(player)) return player;
  const packets = [...player.packets];
  [packets[player.cursor], packets[player.cursor + 1]] = [
    packets[player.cursor + 1],
    packets[player.cursor],
  ];
  return withPackets(player, packets);
}

function lastAppliedSnapshotIndex(player: Player): number {
  for (let i = player.cursor - 1; i >= 0; i--) {
    if (actionOf(player.packets[i]) === "board_snapshot") return i;
  }
  return -1;
}

export function canReplaySnapshot(player: Player): boolean {
  return lastAppliedSnapshotIndex(player) >= 0;
}

/** يعيد آخر لقطة طُبّقت بمراجعة السبورة الحالية نفسها (§8: المساوية تُقبل) */
export function replaySnapshotAtEqualRev(player: Player): Player {
  const at = lastAppliedSnapshotIndex(player);
  if (at < 0) return player;
  const copy = structuredClone(player.packets[at]) as Record<string, unknown>;
  copy.rev = player.session.board.rev;
  const packets = [...player.packets];
  packets.splice(player.cursor, 0, copy);
  return withPackets(player, packets);
}

function isIconAdd(raw: unknown): raw is Record<string, unknown> & { payload: Record<string, unknown> } {
  return (
    isRecord(raw) &&
    raw.action === "board_add" &&
    raw.kind === "icon" &&
    isRecord(raw.payload) &&
    typeof raw.payload.icon === "string"
  );
}

function snapshotIconIndex(raw: unknown): number {
  if (!isRecord(raw) || raw.action !== "board_snapshot" || !Array.isArray(raw.items)) return -1;
  return raw.items.findIndex(
    (item) =>
      isRecord(item) &&
      item.kind === "icon" &&
      isRecord(item.payload) &&
      typeof item.payload.icon === "string",
  );
}

function nextIconIndex(player: Player): number {
  for (let i = player.cursor; i < player.packets.length; i++) {
    const raw = player.packets[i];
    if (isIconAdd(raw) || snapshotIconIndex(raw) >= 0) return i;
  }
  return -1;
}

export function canUseUnknownIcon(player: Player): boolean {
  return nextIconIndex(player) >= 0;
}

/** يستبدل اسم أقرب أيقونة قادمة باسم لا يعرفه الكتالوج */
export function withUnknownIcon(player: Player): Player {
  const at = nextIconIndex(player);
  if (at < 0) return player;
  const copy = structuredClone(player.packets[at]) as Record<string, unknown>;
  if (isIconAdd(copy)) {
    copy.payload.icon = UNKNOWN_ICON_NAME;
  } else {
    const items = copy.items as Record<string, unknown>[];
    const icon = items[snapshotIconIndex(copy)];
    (icon.payload as Record<string, unknown>).icon = UNKNOWN_ICON_NAME;
  }
  const packets = [...player.packets];
  packets[at] = copy;
  return withPackets(player, packets);
}

/* ————— الاستيراد ————— */

export type ImportResult =
  | { ok: true; fixtures: HarnessFixture[] }
  | { ok: false; error: string };

function toFixture(value: Record<string, unknown>, fallbackName: string): HarnessFixture | null {
  if (!Array.isArray(value.messages)) return null;
  const arrivals = Array.isArray(value.arrivals) ? (value.arrivals as Arrival[]) : undefined;
  return {
    name: typeof value.name === "string" && value.name ? value.name : fallbackName,
    status: typeof value.status === "string" && value.status ? value.status : "recorded",
    description: typeof value.description === "string" ? value.description : "",
    covers: Array.isArray(value.covers)
      ? value.covers.filter((c): c is string => typeof c === "string")
      : [],
    messages: value.messages,
    ...(arrivals ? { arrivals } : {}),
  };
}

/** يقبل ملف التجهيزات كاملًا، أو تجهيزًا واحدًا، أو مصفوفة رسائل عارية */
export function parseHarnessInput(text: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }

  if (Array.isArray(json)) {
    return {
      ok: true,
      fixtures: [
        {
          name: "imported-messages",
          status: "recorded",
          description: "",
          covers: [],
          messages: json,
        },
      ],
    };
  }

  if (isRecord(json) && Array.isArray(json.fixtures)) {
    const fixtures = json.fixtures.flatMap((entry, i) =>
      isRecord(entry) ? (toFixture(entry, `imported-${i + 1}`) ?? []) : [],
    );
    return fixtures.length > 0
      ? { ok: true, fixtures }
      : { ok: false, error: "No fixture with a messages array was found." };
  }

  if (isRecord(json)) {
    const fixture = toFixture(json, "imported");
    if (fixture) return { ok: true, fixtures: [fixture] };
  }

  return { ok: false, error: "Expected a fixture, a fixtures file or an array of messages." };
}

/* ————— التسجيل ————— */

export type RecordedPacket = { order: number; at: string; raw: unknown };

export type RecorderState = {
  /** مفتاح الجلسة (اسم الغرفة): جلسة جديدة تبدأ تسجيلًا جديدًا */
  key: string | null;
  packets: RecordedPacket[];
};

export const EMPTY_RECORDER: RecorderState = { key: null, packets: [] };

export function recordPacket(
  state: RecorderState,
  raw: unknown,
  key: string | null,
  now: Date,
): RecorderState {
  const base = state.key === key ? state.packets : [];
  return {
    key,
    packets: [...base, { order: base.length + 1, at: now.toISOString(), raw }],
  };
}

/** صيغة ملف التجهيزات، فيُحمَّل التسجيل في العدّة كأي تجهيز */
export function buildRecording(state: RecorderState): HarnessFixture {
  const messages = state.packets.map((packet) => packet.raw);
  const { log } = replay(messages);
  const label = state.key ?? "session";
  return {
    name: `recorded-${label}`,
    status: "recorded",
    description: `ui-control packets recorded from a live session (${label}) in arrival order.`,
    covers: [],
    messages,
    arrivals: state.packets.map((packet, i) => ({
      order: packet.order,
      at: packet.at,
      action: log[i].action,
      rev: log[i].rev,
      boardRev: log[i].boardRev,
      diverged: log[i].diverged,
    })),
  };
}
