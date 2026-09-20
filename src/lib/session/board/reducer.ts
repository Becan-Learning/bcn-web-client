import {
  INITIAL_BOARD_STATE,
  type BoardAction,
  type BoardItem,
  type BoardState,
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

export function teachingBoardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  if (action.action === "board_reset") return INITIAL_BOARD_STATE;

  const event = action;

  /* ١ — لا تُطبَّق رسالة إلا إن كانت مراجعتها أحدث */
  if (event.rev <= state.rev) return state;

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
        },
      };

    case "board_add": {
      const taken =
        state.title?.id === event.item.id ||
        state.items.some((item) => item.id === event.item.id);
      if (taken) return base;

      return { ...base, visible: true, items: [...state.items, event.item] };
    }

    case "board_group": {
      if (state.groups.some((group) => group.id === event.group.id)) return base;
      return { ...base, groups: [...state.groups, event.group] };
    }

    case "board_update": {
      const patched = withItem(state, event.id, (item) => {
        /* بخانة: يخاطب ابنًا — فراغًا يُملأ أو خيارًا يُصحَّح */
        if (event.slot !== null) {
          const slot = { ...item.slots[event.slot] };
          if (event.text !== null) slot.text = event.text;
          if (event.state !== null) slot.state = event.state;
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

    case "board_remove": {
      if (state.title?.id === event.id) return { ...base, title: null };
      if (!state.items.some((item) => item.id === event.id)) return base;
      return { ...base, items: state.items.filter((item) => item.id !== event.id) };
    }

    case "board_reveal": {
      const patched = withItem(state, event.id, (item) => {
        if (item.kind !== "definition") return item;
        const revealed = Math.min(
          Math.max(item.revealed, event.index + 1),
          item.payload.chunks.length,
        );
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
        title: event.title,
        groups: event.groups,
        items: event.items,
        rev: event.rev,
        diverged: false,
      };
  }
}
