/* عقد السبورة — الإصدار الثاني.

   محتوى السبورة صار مؤلَّفًا في خطة الدرس لا مخترَعًا أثناء الشرح:
   الوكيل يقرّر متى بلغ المعلّمُ ملاحظةً مكتوبة، والخادم يوزّع
   المعرّفات ويملك المناطق والسعة وينشر كل تعديل.

   فالسبورة الآن **تغيّر ما هو معروض** — تملأ فراغًا، تصحّح إجابة،
   تكشف سطرًا، تحذف عنصرًا — لا تُلحِق سطورًا نازلةً وحسب.

   أسماء الأفعال والحقول عقدٌ مع الوكيل الخارجي فلا تُعاد تسميتها من
   طرف واحد. المواصفة: docs/frontend-board-spec-v2.md */

/** المناطق الثلاث — السعة يفرضها الخادم لا الصفحة */
export type BoardRegion = "pinned" | "live" | "temporary";

/** مدى المسح: `live` يُبقي المثبَّت، و`all` يمسح العنوان معه */
export type BoardScope = "all" | "live" | "temporary";

export type BoardItemKind =
  | "heading"
  | "text"
  | "bullet"
  | "step"
  | "definition"
  | "term"
  | "equation"
  | "compare"
  | "table"
  | "chain"
  | "blanks"
  | "options"
  | "callout";

/** حالة العنصر — `key` حصريّة، وحصريّتها يفرضها الخادم برسالتين */
export type AnnotationKind =
  | "key"
  | "warning"
  | "correct"
  | "wrong"
  | "broken"
  | "dim";

export type CalloutKind =
  | "loses_marks"
  | "mistake"
  | "mnemonic"
  | "definition"
  | "example"
  | "exam";

export const CALLOUT_KINDS: readonly CalloutKind[] = [
  "loses_marks",
  "mistake",
  "mnemonic",
  "definition",
  "example",
  "exam",
];

/* ————— الحمولات ————— */

export type TextPayload = { text: string };
export type DefinitionPayload = { chunks: string[]; keyWords: string[] };
export type TermPayload = { en: string; ar: string };
export type EquationPayload = { latex: string; display: boolean };

export type CompareRow = { aspect: string; x: string; y: string };
export type ComparePayload = {
  aspectLabel: string;
  /** عمودان لا أكثر: x للأول وy للثاني */
  columns: [string, string];
  rows: CompareRow[];
};

export type TablePayload = {
  variant: string | null;
  header: string[];
  /** خليّة فارغة مشروعة — سطر القيد يملأ المدين أو الدائن لا كليهما */
  rows: string[][];
};

export type ChainPayload = {
  links: string[];
  /** رقم الوصلة (من 1) التي يُكسر واصلُها الداخل، أو null */
  breakAt: number | null;
};

export type BlanksPayload = {
  template: string;
  blanks: { id: string }[];
};

/* `correct` يُسقَط عند التحليل لا عند الرسم: قيمةٌ لا تصل الصفحة
   لا يمكن أن تتسرّب إلى الشاشة قبل أن يجيب الطالب. */
export type OptionsPayload = {
  stem: string;
  options: { id: string; text: string }[];
};

export type CalloutPayload = { kind: CalloutKind; text: string };

export type BoardPayload =
  | TextPayload
  | DefinitionPayload
  | TermPayload
  | EquationPayload
  | ComparePayload
  | TablePayload
  | ChainPayload
  | BlanksPayload
  | OptionsPayload
  | CalloutPayload;

/* ————— العنصر ————— */

/** ما يكتبه `board_update` في خانة ابن: فراغٌ يُملأ أو خيارٌ يُصحَّح */
export type SlotState = "correct" | "wrong" | "broken";
export type SlotValue = { text?: string; state?: SlotState };

type ItemBase = {
  id: string;
  region: BoardRegion;
  /** حاوية أنشأها `board_group` قبله، أو null */
  groupId: string | null;
  annotation: AnnotationKind | null;
  /** مقاطع التعريف الظاهرة؛ 1 لما سواه */
  revealed: number;
  /** معرّف الفراغ · معرّف الخيار · رقم الوصلة (من 0) */
  slots: Record<string, SlotValue>;
};

export type BoardItem = ItemBase &
  (
    | { kind: "title" | "heading" | "text" | "bullet" | "step"; payload: TextPayload }
    | { kind: "definition"; payload: DefinitionPayload }
    | { kind: "term"; payload: TermPayload }
    | { kind: "equation"; payload: EquationPayload }
    | { kind: "compare"; payload: ComparePayload }
    | { kind: "table"; payload: TablePayload }
    | { kind: "chain"; payload: ChainPayload }
    | { kind: "blanks"; payload: BlanksPayload }
    | { kind: "options"; payload: OptionsPayload }
    | { kind: "callout"; payload: CalloutPayload }
  );

export type BoardGroup = {
  id: string;
  kind: "box" | "columns";
  region: BoardRegion;
  heading: string;
};

/* ————— الحالة ————— */

export type BoardState = {
  visible: boolean;
  title: BoardItem | null;
  groups: BoardGroup[];
  /** ترتيب المصفوفة هو ترتيب الرسم */
  items: BoardItem[];
  /** آخر مراجعة طُبّقت */
  rev: number;
  /** وقعت فجوة في `rev` — الحالة تباعدت وتحتاج لقطةً جديدة */
  diverged: boolean;
};

export const INITIAL_BOARD_STATE: BoardState = {
  visible: false,
  title: null,
  groups: [],
  items: [],
  rev: 0,
  diverged: false,
};

/* ————— الرسائل ————— */

export type BoardControlEvent =
  | { action: "board_show"; rev: number }
  | { action: "board_hide"; rev: number }
  | { action: "board_clear"; scope: BoardScope; rev: number }
  | { action: "board_set_title"; id: string; text: string; rev: number }
  | { action: "board_add"; item: BoardItem; rev: number }
  | { action: "board_group"; group: BoardGroup; rev: number }
  | {
      action: "board_update";
      id: string;
      /** بلا خانة: يستبدل نصّ العنصر. بخانة: يخاطب ابنًا */
      slot: string | null;
      text: string | null;
      state: SlotState | null;
      rev: number;
    }
  | { action: "board_annotate"; id: string; kind: AnnotationKind | null; rev: number }
  | { action: "board_remove"; id: string; rev: number }
  /** `index` رقم المقطع الذي ظهر للتوّ (من 0) */
  | { action: "board_reveal"; id: string; index: number; rev: number }
  | { action: "board_pin"; id: string; pinned: boolean; region: BoardRegion; rev: number }
  | {
      action: "board_snapshot";
      rev: number;
      visible: boolean;
      title: BoardItem | null;
      groups: BoardGroup[];
      items: BoardItem[];
    };

/** `board_reset` داخليّ — لا يأتي من الوكيل ولا يحمل `rev` */
export type BoardAction = BoardControlEvent | { action: "board_reset" };
