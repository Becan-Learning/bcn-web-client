import {
  INITIAL_BOARD_STATE,
  type BoardAction,
  type BoardItem,
  type BoardState,
  type Mark,
} from "./types";

/* مخفّض السبورة.

   لا يُعاد التحليل هنا كما كان في الإصدار الأول: الرسالة تصل محلَّلةً
   من `parse.ts` بأسماء الحقول الداخلية (`groupId` · `keyWords`)،
   وإعادة تمريرها على محلّل الأسلاك كانت سترفضها. التحقّق عند الحدّ
   وحده — أي عند مستمع قناة البيانات.

   والقاعدة الحاكمة (§9): معرّف مجهول يُتجاهل بصمت ولا يرمي أبدًا. */

/** يطبّق `fn` على العنصر صاحب المعرّف، أو null إن لم يوجد */
function withItem(
  state: BoardState,
  id: string,
  fn: (item: BoardItem) => BoardItem,
): Pick<BoardState, "title" | "items"> | null {
  if (state.title?.id === id) {
    return { title: fn(state.title), items: state.items };
  }

  const index = state.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const items = state.items.slice();
  items[index] = fn(items[index]);
  return { title: state.title, items };
}

function progressiveLength(item: BoardItem): number | null {
  if (item.kind === "definition") return item.payload.chunks.length;
  if (item.kind === "table" && item.payload.progressive) return item.payload.rows.length;
  if (item.kind === "timeline" && item.payload.progressive) return item.payload.divisions.length;
  return null;
}

function validMark(item: BoardItem, mark: Omit<Mark, "state">): boolean {
  const inBounds = (index: number | null, length: number) =>
    index !== null && index >= 0 && index < length;
  switch (mark.scope) {
    case "item": return true;
    case "span": return item.kind !== "divider" && item.kind !== "unsupported";
    case "option":
      return item.kind === "options" && item.payload.options.some((option) => option.id === mark.option);
    case "division":
      return item.kind === "timeline" && inBounds(mark.index, item.payload.divisions.length);
    case "row":
    case "cell":
    case "column": {
      if (item.kind !== "table" && item.kind !== "compare") return false;
      const columns = item.kind === "compare" ? 3 : item.payload.header.length;
      if (mark.scope === "row") return inBounds(mark.index, item.payload.rows.length);
      if (mark.scope === "column") return inBounds(mark.index, columns);
      return mark.cell !== null && inBounds(mark.cell[0], item.payload.rows.length) &&
        inBounds(mark.cell[1], columns);
    }
  }
}

function sameAddress(a: Omit<Mark, "state">, b: Omit<Mark, "state">): boolean {
  if (a.scope !== b.scope) return false;
  switch (a.scope) {
    case "item": return true;
    case "row":
    case "column":
    case "division": return a.index === b.index;
    case "cell": return a.cell?.[0] === b.cell?.[0] && a.cell?.[1] === b.cell?.[1];
    case "option": return a.option === b.option;
    case "span": return a.match === b.match;
  }
}

/* عدد الظاهر مضمون هنا كي لا يضطر كل عارض لتخمين معنى اللقطة القديمة. */
function normaliseItem(item: BoardItem): BoardItem {
  const length = progressiveLength(item);
  const revealed = length !== null ? Math.min(Math.max(1, item.revealed), length) :
    item.kind === "table" ? item.payload.rows.length :
    item.kind === "timeline" ? item.payload.divisions.length : 1;
  return { ...item, revealed, marks: item.marks.filter((mark) => validMark(item, mark)) };
}

export function teachingBoardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  if (action.action === "board_reset") return INITIAL_BOARD_STATE;

  const event = action;

  /* اللقطة تُعيد المراجعة نفسها لأن أخذها لا يقدّم عدّاد الخادم. */
  if (event.rev < state.rev || (event.rev === state.rev && event.action !== "board_snapshot")) return state;

  /* ٢ — قفزةٌ في العدّاد تعني أن الحالة تباعدت: يُرسم ما وصل،
         وتُرفع الراية بدل التخمين. اللقطة وحدها تُنزلها. */
  const diverged = state.diverged || event.rev > state.rev + 1;

  /* المراجعة تتقدّم حتى حين لا يتغيّر شيء (معرّف مجهول مثلًا):
     الخادم قَبِل التعديل وقدّم عدّاده، وتجميدُه هنا يجعل كل رسالة
     تالية تبدو فجوة. */
  const base = { ...state, rev: event.rev, diverged };

  switch (event.action) {
    case "board_show":
      return { ...base, visible: true };

    case "board_hide":
      return { ...base, visible: false };

    /* المسح يُبقي الظهور — العمود لا ينطوي (§4.1) */
    case "board_clear": {
      if (event.scope === "all") {
        return { ...base, title: null, groups: [], items: [] };
      }
      return {
        ...base,
        items: state.items.filter((item) => item.region !== event.scope),
        groups: state.groups.filter((group) => group.region !== event.scope),
      };
    }

    case "board_set_title":
      return {
        ...base,
        visible: true,
        title: {
          id: event.id,
          kind: "title",
          region: "live",
          payload: { text: event.text },
          groupId: null,
          annotation: null,
          revealed: 1,
          slots: {},
          pen: null,
          marks: [],
        },
      };

    case "board_add": {
      const taken =
        state.title?.id === event.item.id ||
        state.items.some((item) => item.id === event.item.id);
      if (taken) return base;

      return { ...base, visible: true, items: [...state.items, normaliseItem(event.item)] };
    }

    case "board_group": {
      if (state.groups.some((group) => group.id === event.group.id)) return base;
      return { ...base, visible: true, groups: [...state.groups, event.group] };
    }

    case "board_update": {
      const patched = withItem(state, event.id, (item) => {
        /* بخانة: يخاطب ابنًا — فراغًا يُملأ أو خيارًا يُصحَّح */
        if (event.slot !== null) {
          const valid = item.kind === "blanks"
            ? item.payload.blanks.some((blank) => blank.id === event.slot) && event.text !== null
            : item.kind === "options"
              ? item.payload.options.some((option) => option.id === event.slot) && event.state !== null
              : item.kind === "chain" && /^(0|[1-9]\d*)$/.test(event.slot) &&
                Number(event.slot) < item.payload.links.length && event.state !== null;
          if (!valid) return item;
          const slot = { ...item.slots[event.slot] };
          if (item.kind === "blanks" && event.text !== null) slot.text = event.text;
          if (item.kind !== "blanks" && event.state !== null) slot.state = event.state;
          return { ...item, slots: { ...item.slots, [event.slot]: slot } };
        }

        /* بلا خانة: يستبدل نصّ العنصر — ولا يناله إلا ما لحمولته نصّ */
        if (event.text === null || !("text" in item.payload)) return item;
        return { ...item, payload: { ...item.payload, text: event.text } } as BoardItem;
      });

      return patched ? { ...base, ...patched } : base;
    }

    case "board_annotate": {
      /* حصريّة `key` يفرضها الخادم برسالتَي مسحٍ ثم تعيين، فلا
         تُفرض هنا: فرضُها مرّتين يبتلع إحدى الرسالتين. */
      const patched = withItem(state, event.id, (item) =>
        item.annotation === event.kind ? item : { ...item, annotation: event.kind },
      );

      return patched ? { ...base, ...patched } : base;
    }

    case "board_mark": {
      const patched = withItem(state, event.id, (item) => {
        if (!validMark(item, event)) return item;
        const { scope, index, cell, option, match, state: markState } = event;
        const marks = markState === "clear"
          ? scope === "item" ? [] : item.marks.filter((mark) => !sameAddress(mark, event))
          : [...item.marks, { scope, index, cell, option, match, state: markState }];
        return { ...item, marks };
      });
      return patched ? { ...base, ...patched } : base;
    }

    case "board_remove": {
      if (state.title?.id === event.id) return { ...base, title: null };
      if (!state.items.some((item) => item.id === event.id)) return base;
      return { ...base, items: state.items.filter((item) => item.id !== event.id) };
    }

    case "board_reveal": {
      const patched = withItem(state, event.id, (item) => {
        const length = progressiveLength(item);
        if (length === null || event.index < 0 || event.index >= length) return item;
        const revealed = Math.max(item.revealed, event.index + 1);
        return revealed === item.revealed ? item : { ...item, revealed };
      });

      return patched ? { ...base, ...patched } : base;
    }

    /* النقل يبقي العنصر في موضعه من المصفوفة، فيحتفظ بمفتاحه
       وتُحرَّك نقلتُه بدل أن يقفز (§3). */
    case "board_pin": {
      const patched = withItem(state, event.id, (item) =>
        item.region === event.region ? item : { ...item, region: event.region },
      );

      return patched ? { ...base, ...patched } : base;
    }

    /* ٤ — اللقطة تحلّ محلّ كل شيء، وتُنزل راية التباعد */
    case "board_snapshot":
      return {
        visible: event.visible,
        title: event.title === null ? null : normaliseItem(event.title),
        groups: event.groups,
        items: event.items.map(normaliseItem),
        rev: event.rev,
        diverged: false,
      };
  }
}
