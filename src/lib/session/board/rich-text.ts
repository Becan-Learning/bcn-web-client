import type { Decoration } from "./marks";
import type { Mark, Pen } from "./types";

/* نصّ السبورة النقيّ — بلا React.

   ثلاث مراحل بهذا الترتيب لأن كلًّا منها يقرأ ما قبلها:

     1. الوسوم (§4.1) تُحوَّل إلى نصٍّ ظاهر **بلا وسوم** ومعه نطاقات
        التنسيق. فالنصّ الظاهر هو المرجع الوحيد لما يلي.
     2. العزل الاتجاهي (§4.3) يُحسب على النص الظاهر لا على المصدر،
        وإلا انشقّ التتابع اللاتيني عند كل وسم (`cm^{2}`).
     3. علامات المقاطع (§6) تُطابَق على النص الظاهر نفسه.

   الناتج وصفٌ شجريّ (عقد ← مجموعات ← قطع) يرسمه المكوّن كما هو؛
   فكل قرارٍ اتجاهيّ أو تطابقيّ يُختبر هنا دون رسم. */

export type StyleKind =
  | "bold"
  | "underline"
  | "strike"
  | "sup"
  | "sub"
  | "highlight"
  | "keyword";

export type StyleRange = {
  start: number;
  end: number;
  kind: StyleKind;
  /** القلم المسمّى في `=={pen}…==`؛ null يعني قلم العنصر */
  pen: Pen | null;
};

export type ParsedText = {
  /** النص كما يراه الطالب: بلا وسوم ولا أسماء أقلام */
  visible: string;
  styles: StyleRange[];
  /** موضع كل فراغ في `visible` — محجوز بحرفٍ بديل لا يطابقه شيء */
  blanks: { at: number; index: number }[];
};

/** يحجز موضع الفراغ في النص الظاهر فلا تتزحزح فهارس ما بعده */
export const BLANK_CHAR = "￼";

const PEN_NAMES: readonly Pen[] = ["mark", "construct", "flow", "trap", "alt"];

function isPen(name: string): name is Pen {
  return (PEN_NAMES as readonly string[]).includes(name);
}

type Opener = {
  kind: Exclude<StyleKind, "keyword">;
  pen: Pen | null;
  contentStart: number;
  close: string;
};

function openerAt(source: string, i: number): Opener | null {
  const two = source.slice(i, i + 2);
  switch (two) {
    case "**":
      return { kind: "bold", pen: null, contentStart: i + 2, close: "**" };
    case "__":
      return { kind: "underline", pen: null, contentStart: i + 2, close: "__" };
    case "~~":
      return { kind: "strike", pen: null, contentStart: i + 2, close: "~~" };
    case "^{":
      return { kind: "sup", pen: null, contentStart: i + 2, close: "}" };
    case "_{":
      return { kind: "sub", pen: null, contentStart: i + 2, close: "}" };
    case "==": {
      if (source[i + 2] !== "{") {
        return { kind: "highlight", pen: null, contentStart: i + 2, close: "==" };
      }
      const end = source.indexOf("}", i + 3);
      const name = end === -1 ? "" : source.slice(i + 3, end);
      /* اسم قلمٍ غير معروف ليس وسمًا: يبقى المصدر حرفيًا (§4.1) */
      return isPen(name)
        ? { kind: "highlight", pen: name, contentStart: end + 1, close: "==" }
        : null;
    }
    default:
      return null;
  }
}

function scanMarkup(piece: string, out: { visible: string; styles: StyleRange[] }) {
  let i = 0;
  while (i < piece.length) {
    /* `___` تبقى حرفية حين لا يُرسم فراغ، كي لا يقرؤها `__` تسطيرًا */
    if (piece.startsWith("___", i)) {
      out.visible += "___";
      i += 3;
      continue;
    }
    const opener = openerAt(piece, i);
    if (opener) {
      const close = piece.indexOf(opener.close, opener.contentStart);
      /* الوسم الذي بلا محتوى أو بلا إغلاق يُعرض حرفيًا بلا استثناء */
      if (close > opener.contentStart) {
        const start = out.visible.length;
        out.visible += piece.slice(opener.contentStart, close);
        out.styles.push({
          start,
          end: out.visible.length,
          kind: opener.kind,
          pen: opener.pen,
        });
        i = close + opener.close.length;
        continue;
      }
    }
    out.visible += piece[i];
    i += 1;
  }
}

/** `___` يُقسَّم قبل الوسوم (§4.1)، ثم يُفكَّك كل جزء بلا تعشيش */
export function parseMarkup(
  text: string,
  { markup, blanks }: { markup: boolean; blanks: boolean },
): ParsedText {
  const out = { visible: "", styles: [] as StyleRange[] };
  const blankList: ParsedText["blanks"] = [];
  const pieces = blanks ? text.split("___") : [text];

  pieces.forEach((piece, index) => {
    if (index > 0) {
      blankList.push({ at: out.visible.length, index: index - 1 });
      out.visible += BLANK_CHAR;
    }
    if (markup) scanMarkup(piece, out);
    else out.visible += piece;
  });

  return { visible: out.visible, styles: out.styles, blanks: blankList };
}

/* ————— العزل الاتجاهي (§4.3) ————— */

const LATIN = /\p{Script=Latin}/u;
const GREEK = /\p{Script=Greek}/u;
const DIGIT = /[0-9]/;
/* الأس والدليل: ² ³ ¹ وكتلة الأسس والأدلّة كلها (⁻ ⁴ ₂ …) */
const SUP_SUB = /[²³¹⁰-₟]/;
/* رموز الوحدات التي لا تُعدّ حروفًا لاتينية: ° ′ ″ µ */
const UNIT_SYMBOL = /[°′″µ]/;
const SIGNS = new Set(["+", "−", "-", "±"]);
const MATH_PUNCT = new Set([
  ..."=+−-×÷/.,()[]%±≤≥≠→←⇒⇐↔≈<>⋅",
]);
const OPENERS: Record<string, string> = { "(": ")", "[": "]" };
const CLOSERS = new Set([")", "]"]);

function isLetter(ch: string) {
  return LATIN.test(ch) || GREEK.test(ch);
}

function isAlnum(ch: string | undefined) {
  return ch !== undefined && (LATIN.test(ch) || DIGIT.test(ch));
}

/** يبدأ التتابع بحرفٍ لاتيني أو رقمٍ غربيّ أو رقمٍ بإشارة ولو فصلتها مسافات */
function startsRun(text: string, i: number) {
  const ch = text[i];
  if (isLetter(ch) || DIGIT.test(ch)) return true;
  if (!SIGNS.has(ch)) return false;
  let j = i + 1;
  while (j < text.length && /\s/.test(text[j])) j += 1;
  return j < text.length && DIGIT.test(text[j]);
}

function continuesRun(text: string, i: number) {
  const ch = text[i];
  if (ch === BLANK_CHAR) return false;
  if (isLetter(ch) || DIGIT.test(ch) || SUP_SUB.test(ch) || UNIT_SYMBOL.test(ch)) return true;
  if (/\s/.test(ch) || MATH_PUNCT.has(ch)) return true;
  /* النقطتان بين رمزين فقط (1:2 · 12:30)، وإلا فهي علامة نثرٍ عربيّ */
  return ch === ":" && isAlnum(text[i - 1]) && isAlnum(text[i + 1]);
}

/** ما يحقّ أن يُختَم به التتابع — الرموز والمسافات الطرفية تبقى للنثر المحيط */
function endsRun(ch: string) {
  return (
    isLetter(ch) ||
    DIGIT.test(ch) ||
    SUP_SUB.test(ch) ||
    UNIT_SYMBOL.test(ch) ||
    ch === "%" ||
    CLOSERS.has(ch)
  );
}

function trimEnd(text: string, start: number, end: number) {
  let e = end;
  while (e > start && !endsRun(text[e - 1])) e -= 1;
  return e;
}

/** أول قوسٍ بلا قرين داخل المدى، أو -1 */
function firstUnpaired(text: string, start: number, end: number) {
  const stack: { ch: string; at: number }[] = [];
  for (let i = start; i < end; i += 1) {
    const ch = text[i];
    if (ch in OPENERS) stack.push({ ch, at: i });
    else if (CLOSERS.has(ch)) {
      const top = stack[stack.length - 1];
      if (top && OPENERS[top.ch] === ch) stack.pop();
      else return i;
    }
  }
  return stack.length > 0 ? stack[0].at : -1;
}

/** مدى [بداية، نهاية) لكل تتابع لاتيني/رقمي يُلَفّ كاملًا في `<bdi dir="ltr">` */
export function ltrRuns(text: string): [number, number][] {
  const runs: [number, number][] = [];
  let i = 0;
  while (i < text.length) {
    if (!startsRun(text, i)) {
      i += 1;
      continue;
    }
    let raw = i;
    while (raw < text.length && continuesRun(text, raw)) raw += 1;

    let s = i;
    let e = trimEnd(text, s, raw);
    /* قوسٌ مغلق بلا فاتح داخل التتابع وفاتحه ملاصقٌ له: يدخل التتابع،
       وإلا انقسم القوسان على اتجاهين وانعكس أحدهما. */
    for (;;) {
      const bad = firstUnpaired(text, s, e);
      if (bad === -1) break;
      if (CLOSERS.has(text[bad]) && s > 0 && text[s - 1] in OPENERS && bad >= s) {
        const probe = firstUnpaired(text, s - 1, e);
        if (probe === -1) {
          s -= 1;
          break;
        }
      }
      e = trimEnd(text, s, bad);
    }
    if (e > s) runs.push([s, e]);
    i = Math.max(e, i + 1);
  }
  return runs;
}

/* ————— علامات المقاطع (§6) ————— */

const NEUTRAL: Decoration = {
  highlight: false,
  answer: null,
  dim: false,
  strike: false,
  focus: false,
  dimmedByFocus: false,
};

/** مفتاح الزخرفة؛ الفارغ يعني «لا زخرفة» فلا يُلَفّ المقطع بشيء */
export function decorationKey(decoration: Decoration | null) {
  if (!decoration) return "";
  const parts = [
    decoration.highlight ? "h" : "",
    decoration.answer ?? "",
    decoration.dim ? "d" : "",
    decoration.strike ? "s" : "",
    decoration.focus ? "f" : "",
    decoration.dimmedByFocus ? "b" : "",
  ];
  return parts.some(Boolean) ? parts.join("|") : "";
}

export function spanMarks(marks: Mark[]): Mark[] {
  return marks.filter((mark) => mark.scope === "span" && mark.match);
}

/** كل ظهورٍ حرفيّ حسّاس لحالة الأحرف، بلا تداخل بين الظهورين */
export function occurrences(text: string, needle: string): number[] {
  const found: number[] = [];
  if (!needle) return found;
  let from = 0;
  for (;;) {
    const at = text.indexOf(needle, from);
    if (at === -1) return found;
    found.push(at);
    from = at + needle.length;
  }
}

/** زخرفة كل حرفٍ ظاهر، أو null حين لا يصيب أيٌّ من العلامات هذا الحقل.

   الخصائص مستقلّة تتجمّع، والمتعارض منها (صحيح/خطأ) يفوز فيه الأحدث
   (§6.3). والتركيز يُخفِت **بقيّة الحقل** وحده (§11.2): اتحاد الأهداف
   المركَّز عليها يبقى بارزًا. */
export function spanDecorations(text: string, spans: Mark[]): Decoration[] | null {
  const marks = spanMarks(spans);
  if (marks.length === 0) return null;

  const cells: Decoration[] = Array.from({ length: text.length }, () => ({ ...NEUTRAL }));
  let touched = false;
  let focusSeen = false;

  for (const mark of marks) {
    for (const at of occurrences(text, mark.match as string)) {
      const end = at + (mark.match as string).length;
      touched = true;
      for (let i = at; i < end; i += 1) {
        const cell = cells[i];
        switch (mark.state) {
          case "highlight":
            cell.highlight = true;
            break;
          case "correct":
          case "wrong":
            cell.answer = mark.state;
            break;
          case "dim":
            cell.dim = true;
            break;
          case "strike":
            cell.strike = true;
            break;
          case "focus":
            cell.focus = true;
            focusSeen = true;
            break;
        }
      }
    }
  }

  if (!touched) return null;
  if (focusSeen) {
    for (const cell of cells) if (!cell.focus) cell.dimmedByFocus = true;
  }
  return cells;
}

/* ————— التركيب ————— */

export type Piece = { text: string; style: StyleRange | null };

export type DecoGroup = {
  deco: Decoration | null;
  /** المجموعة تكملة لمدىً زخرفيّ قطعه حدّ التتابع: لا أيقونة ثانية له */
  continued: boolean;
  pieces: Piece[];
};

export type RichNode =
  | { type: "blank"; index: number }
  | { type: "flow"; groups: DecoGroup[] }
  | { type: "ltr"; groups: DecoGroup[] };

/** كلمات الإبراز في التعريف: بلا حساسية لحالة الأحرف ولا اشتقاق (§5.6) */
function emphasise(parsed: ParsedText, words: string[]) {
  const needles = [...new Set(words.map((w) => w.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (needles.length === 0) return;

  const pattern = new RegExp(
    needles.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "giu",
  );
  for (const match of parsed.visible.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const overlaps = parsed.styles.some((s) => s.start < end && start < s.end);
    if (!overlaps && match[0].length > 0) {
      parsed.styles.push({ start, end, kind: "keyword", pen: null });
    }
  }
}

export function layoutRichText(
  text: string,
  options: {
    markup: boolean;
    blanks: boolean;
    spans: Mark[];
    emphasis?: string[];
  },
): RichNode[] {
  const parsed = parseMarkup(text, options);
  if (options.emphasis?.length) emphasise(parsed, options.emphasis);

  const { visible } = parsed;
  const length = visible.length;

  const runOf = new Array<number>(length).fill(-1);
  ltrRuns(visible).forEach(([s, e], id) => {
    for (let i = s; i < e; i += 1) runOf[i] = id;
  });

  const styleOf = new Array<number>(length).fill(-1);
  parsed.styles.forEach((range, id) => {
    for (let i = range.start; i < range.end; i += 1) styleOf[i] = id;
  });

  const decos = spanDecorations(visible, options.spans);
  const decoKeys = Array.from({ length }, (_, i) => (decos ? decorationKey(decos[i]) : ""));
  const blankAt = new Map(parsed.blanks.map((b) => [b.at, b.index]));

  const nodes: RichNode[] = [];

  function groupsFor(start: number, end: number): DecoGroup[] {
    const groups: DecoGroup[] = [];
    let i = start;
    while (i < end) {
      let j = i;
      while (j < end && decoKeys[j] === decoKeys[i]) j += 1;

      const neutral = decoKeys[i] === "" || !decos;
      const pieces: Piece[] = [];
      let k = i;
      while (k < j) {
        let m = k;
        while (m < j && styleOf[m] === styleOf[k]) m += 1;
        pieces.push({
          text: visible.slice(k, m),
          style: styleOf[k] === -1 ? null : parsed.styles[styleOf[k]],
        });
        k = m;
      }
      groups.push({
        deco: neutral || !decos ? null : decos[i],
        continued: !neutral && i > 0 && !blankAt.has(i - 1) && decoKeys[i - 1] === decoKeys[i],
        pieces,
      });
      i = j;
    }
    return groups;
  }

  let i = 0;
  while (i < length) {
    const blank = blankAt.get(i);
    if (blank !== undefined) {
      nodes.push({ type: "blank", index: blank });
      i += 1;
      continue;
    }
    let j = i;
    while (j < length && !blankAt.has(j) && runOf[j] === runOf[i]) j += 1;
    nodes.push({
      type: runOf[i] === -1 ? "flow" : "ltr",
      groups: groupsFor(i, j),
    });
    i = j;
  }
  return nodes;
}
