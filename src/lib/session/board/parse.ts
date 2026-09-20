import {
  CALLOUT_KINDS,
  type AnnotationKind,
  type BoardControlEvent,
  type BoardGroup,
  type BoardItem,
  type BoardItemKind,
  type BoardPayload,
  type BoardRegion,
  type BoardScope,
  type SlotState,
  type SlotValue,
} from "./types";

/* تحليل رسائل السبورة — حارسٌ بين قناة البيانات والمخفّض.

   القاعدة: كل حمولة تُتحقَّق بشكلها، ولا تُشذَّب ولا تُقصّ ولا يُعاد
   تشكيل حروفها. النصّ يصل من الخادم مُسوّى أصلًا (المواصفة §5.1)،
   فأي تدخّل هنا تشويه لا حماية.

   ولا سقف للعدد ولا للطول: السعة يملكها الخادم (§3)، والصفحة لا
   تفرض سياسة فيضٍ خاصّة بها. */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** نصّ غير فارغ، كما وصل حرفًا بحرف */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** خليّة قد تكون فارغة مشروعةً — سطر القيد يملأ جانبًا واحدًا (§5.7) */
function cell(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function int(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function texts(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const entry of value) {
    const t = text(entry);
    if (t === null) return null;
    out.push(t);
  }
  return out;
}

const REGIONS: readonly BoardRegion[] = ["pinned", "live", "temporary"];
const SCOPES: readonly BoardScope[] = ["all", "live", "temporary"];
const ANNOTATIONS: readonly AnnotationKind[] = [
  "key",
  "warning",
  "correct",
  "wrong",
  "broken",
  "dim",
];
const SLOT_STATES: readonly SlotState[] = ["correct", "wrong", "broken"];
const ITEM_KINDS: readonly BoardItemKind[] = [
  "heading",
  "text",
  "bullet",
  "step",
  "definition",
  "term",
  "equation",
  "compare",
  "table",
  "chain",
  "blanks",
  "options",
  "callout",
];

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): T | null =>
  typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;

/* ————— الحمولات ————— */

function parsePayload(kind: BoardItem["kind"], raw: unknown): BoardPayload | null {
  if (!isRecord(raw)) return null;

  switch (kind) {
    case "title":
    case "heading":
    case "text":
    case "bullet":
    case "step": {
      const t = text(raw.text);
      return t === null ? null : { text: t };
    }

    case "definition": {
      const chunks = texts(raw.chunks);
      if (!chunks || chunks.length === 0) return null;
      const keyWords = raw.key_words === undefined ? [] : texts(raw.key_words);
      return keyWords === null ? null : { chunks, keyWords };
    }

    case "term": {
      const en = text(raw.en);
      const ar = text(raw.ar);
      return en === null || ar === null ? null : { en, ar };
    }

    case "equation": {
      const latex = text(raw.latex);
      if (latex === null) return null;
      return { latex, display: raw.display !== false };
    }

    case "compare": {
      const columns = texts(raw.columns);
      if (!columns || columns.length !== 2) return null;
      if (!Array.isArray(raw.rows)) return null;

      const rows = [];
      for (const entry of raw.rows) {
        if (!isRecord(entry)) return null;
        const aspect = cell(entry.aspect);
        const x = cell(entry.x);
        const y = cell(entry.y);
        if (aspect === null || x === null || y === null) return null;
        rows.push({ aspect, x, y });
      }

      return {
        aspectLabel: cell(raw.aspect_label) ?? "",
        columns: [columns[0], columns[1]],
        rows,
      };
    }

    case "table": {
      const header = texts(raw.header);
      if (!header || header.length === 0 || !Array.isArray(raw.rows)) return null;

      /* الصفّ يُسوّى إلى طول الرأس بدل رفضه: عمودٌ منزاح يقرؤه
         المحاسب إجابةً خاطئة، وصفٌّ ناقص خيرٌ من بندٍ غائب. */
      const rows: string[][] = [];
      for (const entry of raw.rows) {
        if (!Array.isArray(entry)) return null;
        const row: string[] = [];
        for (let i = 0; i < header.length; i += 1) {
          const value = cell(entry[i]);
          if (entry[i] !== undefined && value === null) return null;
          row.push(value ?? "");
        }
        rows.push(row);
      }

      return { variant: cell(raw.variant), header, rows };
    }

    case "chain": {
      const links = texts(raw.links);
      if (!links || links.length < 2) return null;

      const breakAt = raw.break_at === null || raw.break_at === undefined ? null : int(raw.break_at);
      if (raw.break_at !== null && raw.break_at !== undefined && breakAt === null) return null;

      return {
        links,
        breakAt: breakAt !== null && breakAt >= 1 && breakAt <= links.length ? breakAt : null,
      };
    }

    case "blanks": {
      const template = text(raw.template);
      if (template === null || !Array.isArray(raw.blanks)) return null;

      const blanks = [];
      for (const entry of raw.blanks) {
        if (!isRecord(entry)) return null;
        const id = text(entry.id);
        if (id === null) return null;
        /* `fill` يُسقَط عمدًا: القيمة تصل لاحقًا بـ board_update،
           ورسمُها عند الإضافة يكشف الجواب قبل أوانه (§5.9). */
        blanks.push({ id });
      }

      return { template, blanks };
    }

    case "options": {
      const stem = text(raw.stem);
      if (stem === null || !Array.isArray(raw.options)) return null;

      const options = [];
      for (const entry of raw.options) {
        if (!isRecord(entry)) return null;
        const id = text(entry.id);
        const label = text(entry.text);
        if (id === null || label === null) return null;
        /* `correct` يُسقَط هنا لا عند الرسم: قيمةٌ لا تبلغ الصفحة
           لا يمكن أن تتسرّب إلى الشاشة قبل أن يجيب الطالب (§5.10). */
        options.push({ id, text: label });
      }

      return { stem, options };
    }

    case "callout": {
      const calloutKind = oneOf(CALLOUT_KINDS, raw.kind);
      const t = text(raw.text);
      return calloutKind === null || t === null ? null : { kind: calloutKind, text: t };
    }
  }
}

function parseSlots(raw: unknown): Record<string, SlotValue> {
  if (!isRecord(raw)) return {};

  const slots: Record<string, SlotValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const slot: SlotValue = {};
    const t = cell(value.text);
    const state = oneOf(SLOT_STATES, value.state);
    if (t !== null) slot.text = t;
    if (state !== null) slot.state = state;
    if (t !== null || state !== null) slots[key] = slot;
  }
  return slots;
}

/** يخدم `board_add` ولقطة `board_snapshot` معًا — الحقول نفسها */
function parseItem(raw: unknown, titleAllowed = false): BoardItem | null {
  if (!isRecord(raw)) return null;

  const id = text(raw.id);
  const region = oneOf(REGIONS, raw.region);
  const kind =
    titleAllowed && raw.kind === "title"
      ? ("title" as const)
      : oneOf(ITEM_KINDS, raw.kind);
  if (id === null || region === null || kind === null) return null;

  const payload = parsePayload(kind, raw.payload);
  if (payload === null) return null;

  const revealed = int(raw.revealed);

  return {
    id,
    kind,
    region,
    payload,
    groupId: text(raw.group_id),
    annotation: oneOf(ANNOTATIONS, raw.annotation),
    revealed: revealed !== null && revealed > 0 ? revealed : 1,
    slots: parseSlots(raw.slots),
  } as BoardItem;
}

function parseGroup(raw: unknown): BoardGroup | null {
  if (!isRecord(raw)) return null;

  const id = text(raw.id);
  const kind = oneOf(["box", "columns"] as const, raw.kind);
  const region = oneOf(REGIONS, raw.region);
  if (id === null || kind === null || region === null) return null;

  return { id, kind, region, heading: cell(raw.heading) ?? "" };
}

/* ————— الرسالة ————— */

export function parseBoardControlEvent(value: unknown): BoardControlEvent | null {
  if (!isRecord(value) || typeof value.action !== "string") return null;
  if (!value.action.startsWith("board_")) return null;

  /* كل رسالة تحمل `rev`، وبها وحدها يُعرف ترتيبها (§9). رسالةٌ بلا
     رقمٍ صحيح لا تُطبَّق: مع الحذف والتعديل في المفردات صار السقوط
     يُفسد الحالة لا يُنقصها سطرًا. */
  const rev = int(value.rev);
  if (rev === null || rev < 0) return null;

  switch (value.action) {
    case "board_show":
    case "board_hide":
      return { action: value.action, rev };

    case "board_clear":
      /* غياب المدى يُقرأ «الكل» احتياطًا (§4.1) */
      return { action: "board_clear", scope: oneOf(SCOPES, value.scope) ?? "all", rev };

    case "board_set_title": {
      const id = text(value.id);
      const t = text(value.text);
      return id === null || t === null ? null : { action: "board_set_title", id, text: t, rev };
    }

    case "board_add": {
      const item = parseItem(value);
      return item === null ? null : { action: "board_add", item, rev };
    }

    case "board_group": {
      const group = parseGroup(value);
      return group === null ? null : { action: "board_group", group, rev };
    }

    case "board_update": {
      const id = text(value.id);
      if (id === null) return null;

      /* خانة الفراغ والخيار معرّف نصّي، وخانة وصلة السلسلة رقمها
         من 0 (§5.8) — فقد تصل عددًا. يُوحَّد الاثنان نصًّا. */
      const slot =
        typeof value.slot === "number" && Number.isInteger(value.slot)
          ? String(value.slot)
          : text(value.slot);
      const t = cell(value.text);
      const state = oneOf(SLOT_STATES, value.state);
      /* بلا خانة يلزم نصّ؛ وبخانة يلزم أحدهما */
      if (slot === null && t === null) return null;
      if (slot !== null && t === null && state === null) return null;

      return { action: "board_update", id, slot, text: t, state, rev };
    }

    case "board_annotate": {
      const id = text(value.id);
      if (id === null) return null;
      /* kind: null يمسح الحالة — والمسح يصل رسالةً مستقلّة قبل
         التعيين الجديد حين تنتقل `key` (§4.3). */
      return { action: "board_annotate", id, kind: oneOf(ANNOTATIONS, value.kind), rev };
    }

    case "board_remove": {
      const id = text(value.id);
      return id === null ? null : { action: "board_remove", id, rev };
    }

    case "board_reveal": {
      const id = text(value.id);
      const index = int(value.index);
      return id === null || index === null || index < 0
        ? null
        : { action: "board_reveal", id, index, rev };
    }

    case "board_pin": {
      const id = text(value.id);
      if (id === null) return null;
      const pinned = value.pinned !== false;
      return {
        action: "board_pin",
        id,
        pinned,
        region: oneOf(REGIONS, value.region) ?? (pinned ? "pinned" : "live"),
        rev,
      };
    }

    case "board_snapshot": {
      /* عنصرٌ تالف يُسقَط وحده ولا يُبطل اللقطة كلها */
      const items = Array.isArray(value.items)
        ? value.items.map((raw) => parseItem(raw)).filter((it): it is BoardItem => it !== null)
        : [];
      const groups = Array.isArray(value.groups)
        ? value.groups.map(parseGroup).filter((g): g is BoardGroup => g !== null)
        : [];

      return {
        action: "board_snapshot",
        rev,
        visible: value.visible !== false,
        title: parseItem(value.title, true),
        groups,
        items,
      };
    }

    default:
      return null;
  }
}
