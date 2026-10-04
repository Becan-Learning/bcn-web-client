/* Fixtures: Becan-Learning/bcn-lk-agent-main feat/board-v3 @ 62d9b47ab3aa710e2d996ba89ee6ccd90434d2ec. */
import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/board-fixtures.json";
import { INITIAL_SESSION_STATE, parseAgentMessage, sessionReducer, type SessionState } from "../session-reducer";
import type { BoardGroup, BoardItem, BoardState, Mark, MarkScope, MarkState } from "./types";

/* التوقعات مكتوبة من الرسائل والمواصفة؛ لا تستمد نتيجة متوقعة من المخفّض. */
type ItemSummary = Omit<BoardItem, "payload">;
type TitleSummary = { id: string; text: string; annotation: BoardItem["annotation"]; pen: BoardItem["pen"]; marks: Mark[] };
type ExpectedBoard = Omit<BoardState, "items" | "title"> & { items: ItemSummary[]; title: TitleSummary | null };

function item(id: string, kind: BoardItem["kind"], fields: Partial<ItemSummary> = {}): ItemSummary {
  return { id, kind, region: "live", revealed: 1, pen: null, groupId: null, annotation: null, slots: {}, marks: [], ...fields };
}
function group(id: string, kind: BoardGroup["kind"], heading: string, fields: Partial<BoardGroup> = {}): BoardGroup {
  return { id, kind, heading, region: "live", stage: null, ...fields };
}
function title(id: string, text: string): TitleSummary {
  return { id, text, annotation: null, pen: null, marks: [] };
}
function mark(scope: MarkScope, state: MarkState, address: Partial<Mark> = {}): Mark {
  return { scope, state, index: null, cell: null, option: null, match: null, ...address };
}
function board(rev: number, items: ItemSummary[] = [], fields: Partial<ExpectedBoard> = {}): ExpectedBoard {
  return { rev, items, visible: true, diverged: false, title: null, groups: [], ...fields };
}

const expected: Record<string, ExpectedBoard> = {
  "add-heading": board(3, [item("board-heading", "heading")]),
  "add-text": board(3, [item("board-text", "text")]),
  "add-bullet": board(3, [item("board-bullet", "bullet")]),
  "add-step": board(4, [item("board-step", "step"), item("board-step-rule", "step")]),
  "add-note": board(3, [item("board-note", "note", { pen: "construct" })]),
  "add-definition": board(4, [item("board-definition", "definition", { revealed: 2 })]),
  "add-term": board(3, [item("board-term", "term")]),
  "add-equation": board(3, [item("board-equation", "equation")]),
  "add-compare": board(3, [item("board-compare", "compare")]),
  "add-table": board(3, [item("board-table", "table", { revealed: 2 })]),
  "add-chain": board(3, [item("board-chain", "chain")]),
  "add-blanks": board(3, [item("board-blanks", "blanks")]),
  "add-options": board(3, [item("board-options", "options")]),
  "add-callout": board(3, [item("board-callout", "callout")]),
  "add-divider": board(3, [item("board-divider", "divider")]),
  "add-timeline": board(3, [item("board-timeline", "timeline", { revealed: 3, pen: "construct" })]),
  "add-icon": board(3, [item("board-icon", "icon", { pen: "construct" })]),
  "frame-lifecycle": board(14),
  "progress-events": board(3, [], { title: title("board-title-si", "2 · السبع وحدات الأساسية (SI)") }),
  "legacy-update-text": board(5, [item("board-text-rule", "text", { annotation: "warning" })]),
  "legacy-update-fill": board(5, [item("board-blanks-rule", "blanks", { slots: { f1: { text: "Derived" }, f2: { text: "Fundamental" } } })]),
  "legacy-slot-states": board(12, [
    item("board-options-mass", "options", { slots: { "opt-gram": { state: "key" } } }),
    item("board-chain-convert", "chain", { slots: { "1": { state: "key" } } }),
  ]),
  "legacy-annotations": board(18, [item("board-text-one", "text"), item("board-text-two", "text")], {
    title: title("board-title-rule", "الكمية الأساسية"),
  }),
  "groups-box-columns": board(7, [
    item("board-term-factor", "term", { groupId: "board-group-box" }),
    item("board-text-fundamental", "text", { groupId: "board-group-columns" }),
    item("board-text-derived", "text", { groupId: "board-group-columns" }),
  ], { groups: [group("board-group-box", "box", "معامل التحويل"), group("board-group-columns", "columns", "أساسية ومشتقة")] }),
  "pin-and-clear": board(8, [item("board-step-given", "step", { annotation: "key", groupId: "board-group-given" })]),
  "remove-item": board(6, [item("board-text-mass", "text", { groupId: "board-group-quantities" })], {
    groups: [group("board-group-quantities", "box", "تحويل الوحدات")],
  }),
  "chain-static-break": board(3, [item("board-chain-static", "chain")]),
  "callout-mistake": board(3, [item("board-callout-mistake", "callout")]),
  "callout-mnemonic": board(3, [item("board-callout-mnemonic", "callout")]),
  "callout-example": board(3, [item("board-callout-example", "callout")]),
  "callout-exam": board(3, [item("board-callout-exam", "callout")]),
  "callout-definition": board(3, [item("board-callout-definition", "callout")]),
  "callout-verbatim": board(4, [item("board-verbatim-ar", "callout"), item("board-verbatim-en", "callout")]),
  "add-table-progressive": board(9, [item("board-table-si", "table", { pen: "construct", revealed: 7 })]),
  "table-static-states": board(5, [item("board-table-prefixes", "table", { pen: "alt", revealed: 4 })]),
  "add-timeline-progressive": board(5, [item("board-timeline-conversion", "timeline", { pen: "flow", revealed: 3 })]),
  "scenario-attached-icons": board(7, [
    item("board-icon-mass", "icon", { pen: "alt", groupId: "board-group-scenario" }),
    item("board-icon-time", "icon", { pen: "flow", groupId: "board-group-scenario" }),
  ], { groups: [group("board-group-scenario", "scenario", "الطول والكتلة والزمن")] }),
  "icon-unknown-placeholder": board(3, [item("board-icon-unknown", "icon")]),
  "example-worked": board(5, [
    item("board-step-worked", "step", { pen: "construct", groupId: "board-group-example-worked" }),
    item("board-equation-worked", "equation", { groupId: "board-group-example-worked" }),
  ], { groups: [group("board-group-example-worked", "example", "أنا أشاهد", { stage: "worked" })] }),
  "example-faded": board(4, [item("board-blanks-faded", "blanks", { groupId: "board-group-example-faded" })], {
    groups: [group("board-group-example-faded", "example", "أنا أملأ", { stage: "faded" })],
  }),
  "example-try": board(4, [item("board-text-try", "text", { groupId: "board-group-example-try" })], {
    groups: [group("board-group-example-try", "example", "هذا لي", { stage: "try" })],
  }),
  "pens-all-roles": board(8, [
    item("board-pen-mark", "text", { pen: "mark" }),
    item("board-pen-construct", "text", { pen: "construct" }),
    item("board-pen-flow", "text", { pen: "flow" }),
    item("board-pen-trap", "text", { pen: "trap" }),
    item("board-pen-alt", "text", { pen: "alt" }),
    item("board-pen-null", "text"),
  ]),
  "markup-showcase": board(6, [
    item("board-text-markup", "text", { pen: "construct" }), item("board-bullet-markup", "bullet"),
    item("board-blanks-markup", "blanks", { slots: { u: { text: "كيلوجرام (kg)" } } }),
  ]),
  "bidi-numbers": board(6, [
    item("board-bidi-reference", "text"), item("board-bidi-signed", "text"),
    item("board-bidi-arrow", "text"), item("board-bidi-numbers", "text"),
  ]),
  "equation-fallback": board(4, [item("board-equation-invalid", "equation"), item("board-equation-inline", "equation")]),
  "equation-long-aligned": board(3, [item("board-equation-long", "equation", { pen: "construct" })]),
  "mark-item-states": board(11, [item("board-mark-item", "text", { pen: "mark" }), item("board-mark-item-sibling", "text")]),
  "mark-row-states": board(10, [item("board-mark-row", "table", { pen: "mark", revealed: 7 })]),
  "mark-cell-states": board(10, [item("board-mark-cell", "table", { pen: "mark", revealed: 7 })]),
  "mark-column-states": board(10, [item("board-mark-column", "table", { pen: "mark", revealed: 7 })]),
  "mark-option-states": board(10, [item("board-mark-option", "options", { pen: "mark" })]),
  "mark-span-states": board(10, [item("board-mark-span", "text", { pen: "mark" })]),
  "mark-division-states": board(10, [item("board-mark-division", "timeline", { pen: "mark", revealed: 3 })]),
  "mark-compare-addresses": board(8, [item("board-compare-marks", "compare", { marks: [
    mark("row", "correct", { index: 1 }), mark("cell", "highlight", { cell: [0, 1] }), mark("column", "highlight", { index: 0 }),
  ] })]),
  "mark-equation-span": board(9, [item("board-equation-marks", "equation", { pen: "mark" })]),
  "mark-item-all-kinds": board(36, [
    item("board-item-heading", "heading", { region: "pinned", marks: [mark("item", "highlight")] }),
    item("board-item-text", "text", { region: "temporary", marks: [mark("item", "highlight")] }),
    item("board-item-bullet", "bullet", { region: "pinned", marks: [mark("item", "highlight")] }),
    item("board-item-step", "step", { region: "temporary", marks: [mark("item", "highlight")] }),
    item("board-item-note", "note", { region: "temporary", marks: [mark("item", "highlight")] }),
    item("board-item-definition", "definition", { marks: [mark("item", "highlight")] }),
    item("board-item-term", "term", { region: "pinned", marks: [mark("item", "highlight")] }),
    item("board-item-equation", "equation", { region: "pinned", marks: [mark("item", "highlight")] }),
    item("board-item-compare", "compare", { marks: [mark("item", "highlight")] }),
    item("board-item-table", "table", { region: "pinned", revealed: 2, marks: [mark("item", "highlight")] }),
    item("board-item-chain", "chain", { region: "pinned", marks: [mark("item", "highlight")] }),
    item("board-item-blanks", "blanks", { marks: [mark("item", "highlight")] }),
    item("board-item-options", "options", { marks: [mark("item", "highlight")] }),
    item("board-item-callout", "callout", { marks: [mark("item", "highlight")] }),
    item("board-item-divider", "divider", { region: "temporary", marks: [mark("item", "highlight")] }),
    item("board-item-timeline", "timeline", { revealed: 3, marks: [mark("item", "highlight")] }),
    item("board-item-icon", "icon", { marks: [mark("item", "highlight")] }),
  ]),
  "mark-span-text-kinds": board(34, [
    item("board-span-heading", "heading", { region: "pinned", marks: [mark("span", "highlight", { match: "Converting" })] }),
    item("board-span-text", "text", { region: "temporary", marks: [mark("span", "highlight", { match: "300 cm" })] }),
    item("board-span-bullet", "bullet", { region: "pinned", marks: [mark("span", "highlight", { match: "كيلوجرام" })] }),
    item("board-span-step", "step", { region: "temporary", marks: [mark("span", "highlight", { match: "300 cm" })] }),
    item("board-span-note", "note", { region: "temporary", marks: [mark("span", "highlight", { match: "بلا معادلة" })] }),
    item("board-span-definition", "definition", { marks: [mark("span", "highlight", { match: "مباشرة" })] }),
    item("board-span-term", "term", { region: "pinned", marks: [mark("span", "highlight", { match: "conversion factor" })] }),
    item("board-span-equation", "equation", { region: "pinned", marks: [mark("span", "highlight", { match: "100\\ \\text{cm}" })] }),
    item("board-span-compare", "compare", { marks: [mark("span", "highlight", { match: "أساسية" })] }),
    item("board-span-table", "table", { region: "pinned", revealed: 2, marks: [mark("span", "highlight", { match: "Cash" })] }),
    item("board-span-chain", "chain", { region: "pinned", marks: [mark("span", "highlight", { match: "square" })] }),
    item("board-span-blanks", "blanks", { marks: [mark("span", "highlight", { match: "الكتلة" })] }),
    item("board-span-options", "options", { marks: [mark("span", "highlight", { match: "كيلوجرام" })] }),
    item("board-span-callout", "callout", { marks: [mark("span", "highlight", { match: "الكيلوجرام" })] }),
    item("board-span-timeline", "timeline", { revealed: 3, marks: [mark("span", "highlight", { match: "النتيجة" })] }),
    item("board-span-icon", "icon", { marks: [mark("span", "highlight", { match: "الطول" })] }),
  ]),
  "mark-accumulate-clear": board(19, [item("board-text-sibling", "text"), item("board-text-new-sibling", "text")]),
  "eviction-live-13": board(17, [
    item("board-term-pinned", "term", { region: "pinned" }),
    item("board-live-2", "text"), item("board-live-3", "text"), item("board-live-4", "text"),
    item("board-live-5", "text"), item("board-live-6", "text"), item("board-live-7", "text"),
    item("board-live-8", "text"), item("board-live-9", "text"), item("board-live-10", "text"),
    item("board-live-11", "text"), item("board-live-12", "text"), item("board-live-13", "text"),
  ]),
  "snapshot-full": board(60, [
    item("board-snapshot-heading", "heading", { region: "pinned", groupId: "board-snapshot-box", pen: "mark" }),
    item("board-snapshot-text", "text", { region: "temporary", groupId: "board-snapshot-columns", pen: "construct", annotation: "warning", marks: [
      mark("item", "highlight"), mark("span", "strike", { match: "300 cm" }),
    ] }),
    item("board-snapshot-bullet", "bullet", { region: "pinned", groupId: "board-snapshot-box", pen: "flow" }),
    item("board-snapshot-step", "step", { region: "temporary", groupId: "board-snapshot-columns", pen: "trap" }),
    item("board-snapshot-note", "note", { region: "temporary", groupId: "board-snapshot-columns", pen: "alt" }),
    item("board-snapshot-definition", "definition", { groupId: "board-snapshot-worked", pen: "mark", revealed: 2 }),
    item("board-snapshot-term", "term", { region: "pinned", groupId: "board-snapshot-box", pen: "construct" }),
    item("board-snapshot-equation", "equation", { region: "pinned", groupId: "board-snapshot-box", pen: "flow", marks: [
      mark("span", "highlight", { match: "100\\ \\text{cm}" }), mark("span", "correct", { match: "3\\ \\text{m}" }),
    ] }),
    item("board-snapshot-compare", "compare", { groupId: "board-snapshot-worked", pen: "trap" }),
    item("board-snapshot-table", "table", { region: "pinned", groupId: "board-snapshot-box", pen: "alt", revealed: 3, marks: [
      mark("row", "correct", { index: 1 }), mark("cell", "highlight", { cell: [1, 1] }), mark("column", "focus", { index: 2 }),
    ] }),
    item("board-snapshot-chain", "chain", { region: "pinned", groupId: "board-snapshot-box", pen: "mark", slots: { "1": { state: "key" } } }),
    item("board-snapshot-blanks", "blanks", { groupId: "board-snapshot-faded", pen: "construct", slots: { u: { text: "كيلوجرام (kg)" } } }),
    item("board-snapshot-options", "options", { groupId: "board-snapshot-try", pen: "flow", slots: { "opt-gram": { state: "wrong" } }, marks: [
      mark("option", "correct", { option: "opt-kg" }),
    ] }),
    item("board-snapshot-callout", "callout", { groupId: "board-snapshot-worked", pen: "trap" }),
    item("board-snapshot-divider", "divider", { region: "temporary", groupId: "board-snapshot-columns", pen: "alt" }),
    item("board-snapshot-timeline", "timeline", { groupId: "board-snapshot-worked", pen: "mark", revealed: 2, marks: [mark("division", "focus", { index: 1 })] }),
    item("board-snapshot-icon", "icon", { groupId: "board-snapshot-scene", pen: "construct" }),
    item("board-snapshot-icon-time", "icon", { groupId: "board-snapshot-scene" }),
  ], {
    title: title("board-snapshot-title", "4 · تحويل الوحدات"),
    groups: [
      group("board-snapshot-box", "box", "مرجع", { region: "pinned" }),
      group("board-snapshot-columns", "columns", "توضيح", { region: "temporary" }),
      group("board-snapshot-worked", "example", "أنا أشاهد", { stage: "worked" }),
      group("board-snapshot-faded", "example", "أنا أملأ", { stage: "faded" }),
      group("board-snapshot-try", "example", "هذا لي", { stage: "try" }),
      group("board-snapshot-scene", "scenario", "الطول والزمن"),
    ],
  }),
  "sequence-worked-conversion": board(8, [
    item("board-step-conversion", "step", { groupId: "board-group-conversion", pen: "construct" }),
    item("board-equation-conversion", "equation", { groupId: "board-group-conversion", pen: "construct", marks: [
      mark("span", "highlight", { match: "100\\ \\text{cm}" }), mark("span", "correct", { match: "3\\ \\text{m}" }),
    ] }),
  ], { title: title("board-title-conversion", "4 · تحويل الوحدات"), groups: [group("board-group-conversion", "example", "حوّل 300 cm إلى m", { stage: "worked" })] }),
  "sequence-answer-remediation": board(7, [item("board-options-answer", "options", { marks: [
    mark("option", "wrong", { option: "opt-gram" }), mark("option", "correct", { option: "opt-kg" }),
  ] })]),
  "sequence-topic-turnover": board(9, [], { title: title("board-title-new", "4 · Converting units") }),
};

export function replay(messages: readonly unknown[], initial = INITIAL_SESSION_STATE): SessionState {
  return messages.reduce<SessionState>((state, packet) => {
    const event = parseAgentMessage(packet);
    expect(event, JSON.stringify(packet)).not.toBeNull();
    return event === null ? state : sessionReducer(state, event);
  }, initial);
}
function summary(state: BoardState): ExpectedBoard {
  return {
    ...state,
    title: state.title && {
      id: state.title.id, text: "text" in state.title.payload ? state.title.payload.text : "",
      annotation: state.title.annotation, pen: state.title.pen, marks: state.title.marks,
    },
    items: state.items.map(({ id, kind, region, revealed, pen, groupId, annotation, slots, marks }) =>
      ({ id, kind, region, revealed, pen, groupId, annotation, slots, marks })),
  };
}
function fixture(name: string) {
  const found = fixtures.fixtures.find((entry) => entry.name === name);
  if (!found) throw new Error(name);
  return found;
}

describe("contract fixture replay through session state", () => {
  it("covers exactly the 63 unedited fixtures", () => {
    expect(fixtures.fixtures).toHaveLength(63);
    expect(Object.keys(expected).sort()).toEqual(fixtures.fixtures.map((entry) => entry.name).sort());
  });
  it.each(fixtures.fixtures)("$name", ({ name, messages }) => {
    expect(summary(replay(messages).board)).toEqual(expected[name]);
  });
  it("progress events preserve lesson, total, topic, checkpoint, ending and board rev", () => {
    const packets = fixture("progress-events").messages;
    const checkpoint = replay(packets.slice(0, 4));
    expect(checkpoint).toMatchObject({
      lesson: { slug: "units_prefixes_and_conversion", totalTopics: 6 },
      topic: { name: "2 · السبع وحدات الأساسية (SI)", index: 3 },
      checkpoint: { question: "وحدة الكتلة في النظام الدولي؟", choices: ["باوند (Pound)", "جرام (Gram)", "كيلوجرام (Kilogram)", "أونصة (Ounce)"] },
      ending: false, endingMessage: null,
    });
    const completedTopic = replay(packets.slice(0, 6));
    expect(completedTopic.topic).toBeNull();
    const end = replay(packets);
    expect(end).toMatchObject({
      lesson: { slug: "units_prefixes_and_conversion", totalTopics: 6 },
      topic: { name: "3 · السوابق (Prefixes)", index: 4 },
      checkpoint: null, ending: true, endingMessage: "Session ending due to time limit.", page: 4,
    });
    expect(end.board.rev).toBe(3);
    const beforeProgress = replay(packets.slice(0, 5));
    expect(replay(packets.slice(5), beforeProgress).board).toBe(beforeProgress.board);
  });
  it("topic turnover keeps progress independent of the board clear", () => {
    expect(replay(fixture("sequence-topic-turnover").messages)).toMatchObject({
      lesson: { slug: "units_prefixes_and_conversion_en", totalTopics: 6 },
      topic: { name: "4 · Converting units", index: 5 }, checkpoint: null, ending: false,
    });
  });
  it("snapshot-full rebuilt as title, groups, adds and mutations is equivalent", () => {
    const packet = fixture("snapshot-full").messages.find((entry) => entry.action === "board_snapshot");
    if (!packet || !("items" in packet) || !packet.items || !("groups" in packet) || !packet.groups || !("title" in packet)) throw new Error("snapshot-full");
    const messages: unknown[] = [];
    let rev = 0;
    const emit = (operation: Record<string, unknown>) => messages.push({ ...operation, rev: ++rev });
    if (packet.title) emit({ action: "board_set_title", id: packet.title.id, text: packet.title.payload.text });
    for (const container of packet.groups) emit({ action: "board_group", ...container });
    for (const record of packet.items) {
      emit({ action: "board_add", id: record.id, kind: record.kind, region: record.region, payload: record.payload, group_id: record.group_id, pen: record.pen });
      for (let index = 1; index < record.revealed; index++) emit({ action: "board_reveal", id: record.id, index });
      for (const [slot, value] of Object.entries(record.slots)) {
        emit({ action: "board_update", id: record.id, slot, [record.kind === "blanks" ? "text" : "state"]: value });
      }
      if (record.annotation !== null) emit({ action: "board_annotate", id: record.id, kind: record.annotation });
      for (const overlay of record.marks) emit({ action: "board_mark", id: record.id, ...overlay });
    }
    emit({ action: packet.visible ? "board_show" : "board_hide" });
    const restored = replay([packet]).board;
    const rebuilt = replay(messages).board;
    expect({ ...rebuilt, rev: restored.rev }).toEqual(restored);
  });
});
