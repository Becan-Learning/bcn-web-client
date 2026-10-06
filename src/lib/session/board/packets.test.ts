/* Fixtures: Becan-Learning/bcn-lk-agent-main feat/board-v3 @ 62d9b47ab3aa710e2d996ba89ee6ccd90434d2ec. */
import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/board-fixtures.json";
import { INITIAL_SESSION_STATE, parseAgentMessage, sessionReducer, type SessionState } from "../session-reducer";
import type { Mark, MarkScope } from "./types";

function apply(messages: readonly unknown[], initial = INITIAL_SESSION_STATE): SessionState {
  return messages.reduce<SessionState>((state, packet) => {
    const event = parseAgentMessage(packet);
    expect(event).not.toBeNull();
    return event ? sessionReducer(state, event) : state;
  }, initial);
}
const add = (id: string, kind: string, payload: unknown, rev = 1, fields: Record<string, unknown> = {}) =>
  ({ action: "board_add", id, kind, payload, region: "live", rev, ...fields });
const overlay = (id: string, scope: MarkScope, state: Mark["state"] | "clear", rev: number, address: Partial<Mark> = {}) =>
  ({ action: "board_mark", id, scope, state, index: null, cell: null, option: null, match: null, rev, ...address });
const tablePayload = { variant: "plain", header: ["a", "b"], rows: [["1", "2"], ["3", "4"], ["5", "6"]], reveal: "progressive" };
const timelinePayload = { axis_label: "axis", divisions: ["one", "two", "three"], markers: [], reveal: "progressive" };
const snapshot = fixtures.fixtures.find((entry) => entry.name === "snapshot-full")?.messages.find((entry) => entry.action === "board_snapshot");
if (!snapshot) throw new Error("snapshot-full");

describe("revision and recovery at the session boundary", () => {
  it("duplicates, stale and reordered operations are ignored without mutation", () => {
    const base = apply([add("a", "text", { text: "original" }), add("b", "text", { text: "latest" }, 3)]);
    const unchanged = apply([
      add("a", "text", { text: "duplicate" }, 1),
      { action: "board_update", id: "a", text: "stale", rev: 2 },
      { action: "board_remove", id: "b", rev: 3 },
    ], base);
    expect(unchanged).toBe(base);
    expect(base.board).toMatchObject({ rev: 3, diverged: true, items: [{ id: "a" }, { id: "b" }] });
    expect(base.board.items[0].payload).toEqual({ text: "original" });
  });
  it("an equal-rev snapshot replaces everything and clears divergence", () => {
    const restored = apply([snapshot]);
    const diverged = apply([{ action: "board_update", id: "board-snapshot-heading", text: "changed", rev: 62 }], restored);
    expect(diverged.board.diverged).toBe(true);
    const recovered = apply([{ ...snapshot, rev: 62 }], diverged);
    expect(recovered.board).toEqual({ ...restored.board, rev: 62 });
    const equal = apply([snapshot], apply([{ action: "board_show", rev: 60 }]));
    expect(equal.board).toEqual(restored.board);
  });
  it("rejects older snapshots and accepts a zero-rev snapshot on empty state", () => {
    const restored = apply([snapshot]);
    expect(apply([{ ...snapshot, rev: 59, items: [] }], restored)).toBe(restored);
    const zero = apply([{ ...snapshot, rev: 0 }]);
    expect(zero.board.rev).toBe(0);
    expect(zero.board.items).toHaveLength(18);
    expect(zero.board.diverged).toBe(false);
  });
  it.each([
    { action: "board_update", text: "new" },
    { action: "board_annotate", kind: "key" },
    { action: "board_mark", scope: "item", state: "focus", index: null, cell: null, option: null, match: null },
    { action: "board_remove" },
    { action: "board_reveal", index: 1 },
    { action: "board_pin", pinned: true, region: "pinned" },
  ])("$action consumes unknown-target rev silently", (operation) => {
    const initial = apply([add("a", "text", { text: "kept" })]);
    const ignored = apply([{ ...operation, id: "missing", rev: 2 }], initial);
    expect(ignored.board).toEqual({ ...initial.board, rev: 2 });
    expect(ignored.board.items).toBe(initial.board.items);
    expect(apply([{ action: "board_show", rev: 3 }], ignored).board.diverged).toBe(false);
  });
  it("unknown kinds produce an unsupported item and preserve the revision sequence", () => {
    const state = apply([add("future", "future_kind", { private_content: "discard" }), add("next", "text", { text: "next" }, 2)]);
    expect(state.board.items[0]).toEqual({ id: "future", kind: "unsupported", payload: { wireKind: "future_kind" },
      region: "live", groupId: null, annotation: null, revealed: 1, slots: {}, pen: null, marks: [] });
    expect(state.board.diverged).toBe(false);
    expect(JSON.stringify(state)).not.toContain("discard");
  });
});

describe("mark legality, accumulation and exact clears", () => {
  const kinds: [string, MarkScope[]][] = [
    ["heading", ["item", "span"]], ["text", ["item", "span"]], ["bullet", ["item", "span"]],
    ["step", ["item", "span"]], ["note", ["item", "span"]], ["definition", ["item", "span"]],
    ["term", ["item", "span"]], ["equation", ["item", "span"]],
    ["compare", ["item", "row", "cell", "column", "span"]],
    ["table", ["item", "row", "cell", "column", "span"]],
    ["chain", ["item", "span"]], ["blanks", ["item", "span"]],
    ["options", ["item", "option", "span"]], ["callout", ["item", "span"]],
    ["divider", ["item"]], ["timeline", ["item", "division", "span"]], ["icon", ["item", "span"]],
  ];
  const addresses: [MarkScope, Partial<Mark>][] = [
    ["item", {}], ["row", { index: 0 }], ["cell", { cell: [0, 0] }], ["column", { index: 0 }],
    ["option", { option: "opt-kg" }], ["span", { match: "absent substring" }], ["division", { index: 0 }],
  ];
  it.each(kinds.flatMap(([kind, legal]) => addresses.map(([scope, address]) => ({ kind, legal, scope, address }))))(
    "$kind × $scope follows the contract matrix and consumes rev", ({ kind, legal, scope, address }) => {
      const packet = fixtures.fixtures.find((entry) => entry.name === `add-${kind}`)?.messages.find((entry) => entry.action === "board_add");
      if (!packet || !("id" in packet) || !packet.id) throw new Error(kind);
      const base = apply([{ ...packet, rev: 1 }]);
      const state = apply([overlay(packet.id, scope, "focus", 2, address)], base);
      expect(state.board.items[0].marks).toEqual(legal.includes(scope)
        ? [{ scope, state: "focus", index: null, cell: null, option: null, match: null, ...address }] : []);
      expect(state.board).toMatchObject({ rev: 2, diverged: false });
    },
  );
  it.each([
    ["row", { index: -1 }], ["row", { index: 3 }], ["column", { index: 2 }],
    ["cell", { cell: [3, 0] }], ["cell", { cell: [0, 2] }], ["cell", { cell: [-1, 0] }],
  ] as [MarkScope, Partial<Mark>][]) ("ignores an out-of-bounds table %s while consuming rev", (scope, address) => {
    const state = apply([add("t", "table", tablePayload), overlay("t", scope, "wrong", 2, address)]);
    expect(state.board.items[0].marks).toEqual([]);
    expect(state.board).toMatchObject({ rev: 2, diverged: false });
  });
  it("unknown option ids and out-of-bounds divisions are ignored", () => {
    const state = apply([
      add("o", "options", { stem: "question", options: [{ id: "x", text: "answer" }] }),
      add("t", "timeline", timelinePayload, 2),
      overlay("o", "option", "wrong", 3, { option: "missing" }),
      overlay("t", "division", "focus", 4, { index: 3 }),
    ]);
    expect(state.board.items.map((entry) => entry.marks)).toEqual([[], []]);
    expect(state.board).toMatchObject({ rev: 4, diverged: false });
  });
  it("compare accepts aspect, x and y and rejects a fourth logical column", () => {
    const state = apply([
      add("c", "compare", { aspect_label: "aspect", columns: ["x", "y"], rows: [{ aspect: "a", x: "b", y: "c" }] }),
      overlay("c", "column", "highlight", 2, { index: 0 }),
      overlay("c", "cell", "correct", 3, { cell: [0, 2] }),
      overlay("c", "column", "wrong", 4, { index: 3 }),
      overlay("c", "cell", "wrong", 5, { cell: [0, 3] }),
    ]);
    expect(state.board.items[0].marks).toEqual([
      { scope: "column", state: "highlight", index: 0, cell: null, option: null, match: null },
      { scope: "cell", state: "correct", index: null, cell: [0, 2], option: null, match: null },
    ]);
  });
  it("marks on hidden rows and divisions remain stored without revealing content", () => {
    const state = apply([
      add("t", "table", tablePayload), add("l", "timeline", timelinePayload, 2),
      overlay("t", "row", "correct", 3, { index: 2 }), overlay("l", "division", "focus", 4, { index: 2 }),
    ]);
    expect(state.board.items.map((entry) => [entry.revealed, entry.marks.length])).toEqual([[1, 1], [1, 1]]);
    const revealed = apply([{ action: "board_reveal", id: "t", index: 2, rev: 5 }, { action: "board_reveal", id: "l", index: 2, rev: 6 }], state);
    expect(revealed.board.items.map((entry) => [entry.revealed, entry.marks])).toEqual(state.board.items.map((entry) => [3, entry.marks]));
  });
  it("clear removes every mark at the exact address and preserves all other state", () => {
    const state = apply([
      add("t", "table", { ...tablePayload, rows: [[{ text: "1", state: "highlight" }, "2"], ["3", "4"], ["5", "6"]] }, 1, { pen: "alt" }),
      { action: "board_annotate", id: "t", kind: "warning", rev: 2 },
      overlay("t", "row", "highlight", 3, { index: 1 }),
      overlay("t", "cell", "strike", 4, { cell: [1, 1] }),
      overlay("t", "row", "correct", 5, { index: 1 }),
      overlay("t", "row", "focus", 6, { index: 2 }),
      overlay("t", "row", "clear", 7, { index: 1 }),
    ]);
    expect(state.board.items[0].marks.map((entry) => [entry.scope, entry.state])).toEqual([["cell", "strike"], ["row", "focus"]]);
    const clear = apply([overlay("t", "item", "clear", 8)], state);
    expect(clear.board.items[0]).toEqual({ ...state.board.items[0], marks: [] });
    expect(clear.board.items[0].payload).toBe(state.board.items[0].payload);
  });
  it("span clear is case-sensitive, and missing spans remain in application order", () => {
    const state = apply([
      add("x", "text", { text: "unrelated" }),
      overlay("x", "span", "highlight", 2, { match: "Word" }),
      overlay("x", "span", "strike", 3, { match: "word" }),
      overlay("x", "span", "correct", 4, { match: "Word" }),
      overlay("x", "span", "clear", 5, { match: "Word" }),
    ]);
    expect(state.board.items[0].marks).toEqual([{ scope: "span", state: "strike", index: null, cell: null, option: null, match: "word" }]);
  });
  it("pin preserves all item state and remove drops the focused item", () => {
    const base = apply([
      { action: "board_group", id: "g", kind: "example", stage: "faded", heading: "work", region: "live", rev: 1 },
      add("b", "blanks", { template: "___", blanks: [{ id: "x", fill: "private" }] }, 2, { group_id: "g", pen: "construct" }),
      { action: "board_update", id: "b", slot: "x", text: "filled", rev: 3 },
      { action: "board_annotate", id: "b", kind: "key", rev: 4 }, overlay("b", "item", "focus", 5),
    ]);
    const pinned = apply([{ action: "board_pin", id: "b", pinned: true, region: "pinned", rev: 6 }], base);
    expect(pinned.board.items[0]).toEqual({ ...base.board.items[0], region: "pinned" });
    const removed = apply([{ action: "board_remove", id: "b", rev: 7 }], pinned);
    expect(removed.board.items).toEqual([]);
    expect(removed.board.groups).toEqual(base.board.groups);
  });
});

describe("payloads, restored records and reveal counts", () => {
  it("parses every new payload field without rewriting authored strings", () => {
    const state = apply([
      add("b", "bullet", { text: "  **main**  ", children: ["__child__", "nested text"] }, 1),
      add("n", "note", { text: "side note" }, 2), add("d", "divider", {}, 3),
      add("c", "callout", { kind: "verbatim", text: "exact book words" }, 4),
      add("t", "table", { variant: "plain", header: [{ text: "header", state: "highlight" }, "other"],
        rows: [[{ text: "", state: "dim" }, { text: "correct", state: "correct" }], [{ text: "wrong", state: "wrong" }, "0.04"]],
        numbered_columns: true, reveal: "progressive" }, 5),
      add("l", "timeline", { ...timelinePayload, markers: [{ id: "m", at: 2, label: null, pen: "trap" }] }, 6),
      add("i", "icon", { icon: "unknown_icon", label: "label", attach_to: "absent" }, 7),
    ]);
    expect(state.board.items.map((entry) => entry.payload)).toEqual([
      { text: "  **main**  ", children: ["__child__", "nested text"] }, { text: "side note" }, {},
      { kind: "verbatim", text: "exact book words" },
      { variant: "plain", header: [{ text: "header", state: "highlight" }, { text: "other", state: null }],
        rows: [[{ text: "", state: "dim" }, { text: "correct", state: "correct" }], [{ text: "wrong", state: "wrong" }, { text: "0.04", state: null }]],
        numberedColumns: true, progressive: true },
      { axisLabel: "axis", divisions: ["one", "two", "three"], markers: [{ id: "m", at: 2, label: null, pen: "trap" }], progressive: true },
      { icon: "unknown_icon", label: "label", attachTo: "absent" },
    ]);
  });
  it("legacy omissions become null pen, empty marks, null stage and empty children", () => {
    const state = apply([
      add("x", "bullet", { text: "legacy" }),
      { action: "board_group", id: "g", kind: "columns", heading: "legacy group", region: "live", rev: 2 },
    ]);
    expect(state.board.items[0]).toMatchObject({ pen: null, marks: [], payload: { text: "legacy", children: [] } });
    expect(state.board.groups[0].stage).toBeNull();
  });
  it.each(["box", "columns", "example", "scenario"])("stage is independent of %s group kind and implicitly shows the board", (kind) => {
    const state = apply([{ action: "board_group", id: "g", kind, heading: "group", stage: "try", region: "live", rev: 1 }]);
    expect(state.board.visible).toBe(true);
    expect(state.board.groups[0]).toEqual({ id: "g", kind, heading: "group", stage: "try", region: "live" });
  });
  it.each([
    ["definition", { chunks: ["a", "b", "c"], key_words: [] }],
    ["table", tablePayload], ["timeline", timelinePayload],
  ])("%s starts at one, never decreases and ignores out-of-range reveals", (kind, payload) => {
    const initial = apply([add("x", kind, payload)]);
    expect(initial.board.items[0].revealed).toBe(1);
    const state = apply([
      { action: "board_reveal", id: "x", index: 1, rev: 2 },
      { action: "board_reveal", id: "x", index: 0, rev: 3 },
      { action: "board_reveal", id: "x", index: 3, rev: 4 },
    ], initial);
    expect(state.board.items[0].revealed).toBe(2);
    expect(state.board).toMatchObject({ rev: 4, diverged: false });
  });
  it("non-progressive tables and timelines reveal their full length on add and in legacy snapshots", () => {
    const { reveal: tableReveal, ...table } = tablePayload;
    const { reveal: timelineReveal, ...timeline } = timelinePayload;
    expect(tableReveal).toBe("progressive");
    expect(timelineReveal).toBe("progressive");
    const adds = [add("t", "table", table), add("l", "timeline", timeline, 2)];
    const added = apply(adds);
    expect(added.board.items.map((entry) => entry.revealed)).toEqual([3, 3]);
    const restored = apply([{ action: "board_snapshot", visible: false, title: null, groups: [],
      items: adds.map((entry) => ({ ...entry, revealed: 1, slots: {} })), rev: 2 }]);
    expect(restored.board.items).toEqual(added.board.items);
    const attempted = apply([{ action: "board_reveal", id: "t", index: 0, rev: 3 }, { action: "board_reveal", id: "l", index: 1, rev: 4 }], restored);
    expect(attempted.board.items).toEqual(restored.board.items);
    expect(attempted.board.visible).toBe(false);
  });
  it("snapshot title, groups and items restore pen, marks, stage, slots, annotations and counts", () => {
    const state = apply([{ action: "board_snapshot", rev: 7, visible: false,
      title: { id: "title", kind: "title", region: "live", payload: { text: "heading" }, annotation: "warning", pen: "alt", marks: [
        { scope: "item", state: "highlight", index: null, cell: null, option: null, match: null },
      ] }, groups: [{ id: "g", kind: "scenario", region: "pinned", heading: "scene", stage: "faded" }],
      items: [{ id: "t", kind: "table", region: "pinned", payload: tablePayload, group_id: "g", revealed: 2, slots: {}, pen: "flow", annotation: "key", marks: [
        { scope: "row", index: 2, cell: null, option: null, match: null, state: "wrong" },
        { scope: "row", index: 2, cell: null, option: null, match: null, state: "correct" },
        { scope: "option", index: null, cell: null, option: "bad", match: null, state: "wrong" },
      ] }],
    }]);
    expect(state.board).toMatchObject({ rev: 7, diverged: false, visible: false,
      title: { pen: "alt", annotation: "warning", revealed: 1, marks: [{ scope: "item", state: "highlight" }] },
      groups: [{ kind: "scenario", stage: "faded" }],
      items: [{ region: "pinned", groupId: "g", pen: "flow", annotation: "key", revealed: 2,
        marks: [{ scope: "row", index: 2, state: "wrong" }, { scope: "row", index: 2, state: "correct" }] }],
    });
    const annotated = apply([{ action: "board_annotate", id: "title", kind: "key", rev: 8 }], state);
    expect(annotated.board.title).toEqual({ ...state.board.title, annotation: "key" });
  });
  it("snapshot slots map blank strings to text and all four option/link states to state", () => {
    const options = { stem: "question", options: ["a", "b", "c", "d"].map((id) => ({ id, text: id, correct: id === "a" })) };
    const state = apply([{ action: "board_snapshot", visible: true, title: null, groups: [], rev: 1, items: [
      { id: "b", kind: "blanks", region: "live", payload: { template: "___", blanks: [{ id: "x", fill: "private" }] }, slots: { x: "" } },
      { id: "o", kind: "options", region: "live", payload: options, slots: { a: "correct", b: "wrong", c: "broken", d: "key", invalid: "other" } },
      { id: "c", kind: "chain", region: "live", payload: { links: ["a", "b", "c", "d"] }, slots: { "0": "correct", "1": "wrong", "2": "broken", "3": "key" } },
    ] }]);
    expect(state.board.items.map((entry) => entry.slots)).toEqual([
      { x: { text: "" } }, { a: { state: "correct" }, b: { state: "wrong" }, c: { state: "broken" }, d: { state: "key" } },
      { "0": { state: "correct" }, "1": { state: "wrong" }, "2": { state: "broken" }, "3": { state: "key" } },
    ]);
    expect(JSON.stringify(state)).not.toContain("private");
    const parsed = parseAgentMessage(add("o", "options", options));
    expect(JSON.stringify(parsed)).not.toContain('"correct":');
  });
  it("all six mark states accumulate at each valid scope before clear", () => {
    for (const scope of ["item", "row", "cell", "column", "option", "span", "division"]) {
      const fixture = fixtures.fixtures.find((entry) => entry.name === `mark-${scope}-states`);
      if (!fixture) throw new Error(scope);
      const accumulated = apply(fixture.messages.slice(0, -1));
      expect(accumulated.board.items[0].marks.map((entry) => entry.state)).toEqual(["highlight", "correct", "wrong", "dim", "strike", "focus"]);
      expect(apply(fixture.messages).board.items[0].marks).toEqual([]);
    }
  });
  it("clear retains blank fills and legacy option state", () => {
    const state = apply([
      add("b", "blanks", { template: "___", blanks: [{ id: "x", fill: "secret" }] }),
      { action: "board_update", id: "b", slot: "x", text: "filled", rev: 2 },
      overlay("b", "span", "strike", 3, { match: "filled" }), overlay("b", "item", "clear", 4),
      add("o", "options", { stem: "question", options: [{ id: "a", text: "option", correct: true }] }, 5),
      { action: "board_update", id: "o", slot: "a", state: "wrong", rev: 6 },
      overlay("o", "option", "correct", 7, { option: "a" }), overlay("o", "option", "clear", 8, { option: "a" }),
    ]);
    expect(state.board.items.map((entry) => [entry.slots, entry.marks])).toEqual([[{ x: { text: "filled" } }, []], [{ a: { state: "wrong" } }, []]]);
    expect(JSON.stringify(state)).not.toContain("secret");
  });
});

describe("malformed packets and session reset", () => {
  it.each([
    null, undefined, [], {}, "json text", 2, true, { action: "unknown" }, { action: "board_future", rev: 1 },
    { action: "board_show" }, { action: "board_show", rev: "1" }, { action: "board_show", rev: 1.5 },
    { action: "board_show", rev: -1 }, { action: "board_show", rev: Infinity },
    { action: "board_snapshot", rev: 1 }, { action: "board_snapshot", rev: 1, visible: true, title: null, groups: {}, items: [] },
    add("x", "compare", { columns: ["x", "y"], rows: [{ aspect: "a", x: "b", y: "c" }] }),
    add("x", "table", { variant: "journal", header: ["wrong", "headers"], rows: [["a", "b"]] }),
    add("x", "text", []), add("x", "note", { text: 2 }), add("x", "bullet", { text: "a", children: [{}] }),
    add("x", "text", { text: "a" }, 1, { pen: "invalid" }),
    add("x", "icon", { icon: "ruler", label: "label", attach_to: 2 }),
    add("x", "timeline", { ...timelinePayload, markers: [{ id: "m", at: 3, label: null, pen: null }] }),
    add("x", "timeline", { ...timelinePayload, markers: [{ id: "m", at: 0, label: null, pen: "invalid" }] }),
    add("x", "table", { ...tablePayload, rows: [["a"]] }),
    add("x", "table", { ...tablePayload, numbered_columns: "true" }),
    add("x", "table", { ...tablePayload, rows: [[{ text: "a", state: "focus" }, "b"]] }),
    { action: "board_group", id: "g", kind: "example", heading: "group", region: "live", stage: "invalid", rev: 1 },
    { action: "board_clear", scope: "invalid", rev: 1 }, { action: "board_pin", id: "x", pinned: "yes", rev: 1 },
    { action: "board_annotate", id: "x", kind: "invalid", rev: 1 },
    { action: "board_update", id: "x", slot: "a", state: "invalid", rev: 1 },
    { action: "board_mark", id: "x", scope: "item", state: "correct", rev: 1 },
    overlay("x", "row", "correct", 1), { ...overlay("x", "item", "correct", 1), state: "invalid" },
    overlay("x", "cell", "correct", 1, { cell: [1, 1.5] }), overlay("x", "item", "correct", 1, { index: 0 }),
    { action: "scroll", page: {} }, { action: "set_lesson", lesson: {} },
    { action: "set_lesson", lesson: "lesson", number_of_topics: 1.5 }, { action: "set_topic" },
    { action: "set_topic", topic: {}, current_topic_index: 1 },
    { action: "set_topic", topic: "topic" },
    { action: "set_topic", topic: "topic", current_topic_index: 0 },
    { action: "set_topic", topic: "topic", current_topic_index: 1.5 },
    { action: "set_topic", topic: "topic", current_topic_index: "1" },
    { action: "set_checkpoint" },
    { action: "set_checkpoint", checkpoint: {} },
    { action: "set_checkpoint", checkpoint: { id: "", text: "question", choices: [] } },
    { action: "set_checkpoint", checkpoint: { id: 1, text: "question", choices: [] } },
    { action: "set_checkpoint", checkpoint: { id: "q:1", text: 1, choices: [] } },
    { action: "set_checkpoint", checkpoint: { id: "q:1", text: "question", choices: {} } },
    { action: "set_checkpoint", checkpoint: { id: "q:1", text: "question", choices: [{}] } },
    { action: "set_checkpoint", checkpoint: "question" },
    { action: "set_checkpoint", checkpoint: [] },
    { action: "session_ending" }, { action: "session_ending", message: 2 },
  ])("rejects malformed input %# without throwing", (packet) => {
    expect(() => parseAgentMessage(packet)).not.toThrow();
    expect(parseAgentMessage(packet)).toBeNull();
  });
  it("private answers in an add cannot initialize payload answers or visible slots", () => {
    const state = apply([
      add("b", "blanks", { template: "___", blanks: [{ id: "x", fill: "SECRET_FILL" }] }, 1, { slots: { x: "SECRET_SLOT" } }),
      add("o", "options", { stem: "question", options: [{ id: "x", text: "option", correct: true }] }, 2),
    ]);
    expect(JSON.stringify(state)).not.toContain("SECRET");
    expect(JSON.stringify(state)).not.toContain('"correct":');
    expect(state.board.items.map((entry) => entry.slots)).toEqual([{}, {}]);
  });
  it("disconnect reset clears only the board and preserves progress and ending until the next start", () => {
    const state = apply([
      { action: "set_lesson", lesson: "first", number_of_topics: 2 },
      { action: "set_lesson", lesson: "second", number_of_topics: 3 },
      { action: "set_topic", topic: "topic", current_topic_index: 2 },
      add("x", "text", { text: "old session" }, 3),
      { action: "scroll", page: 5 }, { action: "session_ending", message: "reason" },
    ]);
    expect(state.completedLessons).toEqual(["first"]);
    expect(state.board).toMatchObject({ visible: true, rev: 3, diverged: true });
    const disconnected = sessionReducer(state, { action: "board_reset" });
    expect(disconnected.board).toEqual({ visible: false, title: null, groups: [], items: [], rev: 0, diverged: false });
    expect(disconnected).toEqual({ ...state, board: INITIAL_SESSION_STATE.board });
    expect(sessionReducer(disconnected, { action: "session_reset" })).toEqual({ ...INITIAL_SESSION_STATE, completedLessons: ["first"] });
  });
  it("ending retains exact wire text and updates its reason without changing the board", () => {
    const base = apply([add("x", "text", { text: "kept" })]);
    const ending = apply([{ action: "session_ending", message: "  reason  " }], base);
    expect(ending).toMatchObject({ ending: true, endingMessage: "  reason  " });
    expect(ending.board).toBe(base.board);
    expect(apply([{ action: "session_ending", message: "new reason" }], ending).endingMessage).toBe("new reason");
    expect(parseAgentMessage({ action: "session_ending" })).toBeNull();
  });
});
