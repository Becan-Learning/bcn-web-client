import { expect, it } from "vitest";
import { boardGroup, boardItem, boardState } from "./test-utils";
import { projectRegion, stepNumbers, validAttachments } from "./region-blocks";

const step = (id: string, overrides = {}) => boardItem("step", { text: id }, { id, ...overrides });
const icon = (id: string, attachTo: string | null, overrides = {}) =>
  boardItem("icon", { icon: "ruler", label: id, attachTo }, { id, ...overrides });

it("الخطوات تُرقَّم في كل منطقة على حدة بترتيب ظهورها", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g" })],
    items: [
      step("p1", { region: "pinned" }),
      step("a"),
      boardItem("text", { text: "بين الخطوات" }, { id: "t" }),
      step("b", { groupId: "g" }),
      step("c"),
    ],
  });

  expect([...stepNumbers(projectRegion(state, "live"))]).toEqual([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]);
  expect([...stepNumbers(projectRegion(state, "pinned"))]).toEqual([["p1", 1]]);
});

it("الترقيم يُعاد بعد الحذف والنقل", () => {
  const items = [step("a"), step("b"), step("c")];
  const before = boardState({ items });
  expect(stepNumbers(projectRegion(before, "live")).get("c")).toBe(3);

  const afterRemoval = boardState({ items: items.filter((item) => item.id !== "a") });
  expect([...stepNumbers(projectRegion(afterRemoval, "live"))]).toEqual([
    ["b", 1],
    ["c", 2],
  ]);

  const afterPin = boardState({
    items: [items[0], { ...items[1], region: "pinned" as const }, items[2]],
  });
  expect(stepNumbers(projectRegion(afterPin, "live")).get("c")).toBe(2);
  expect(stepNumbers(projectRegion(afterPin, "pinned")).get("b")).toBe(1);
});

it("عنوان المجموعة لا يُرقَّم ولا يقطع العدّ", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g" })],
    items: [step("a"), step("b", { groupId: "g" }), step("c", { groupId: "g" })],
  });
  expect(stepNumbers(projectRegion(state, "live")).get("c")).toBe(3);
});

it("العضو المثبَّت يُسقَط في المثبَّت بحاويته ويبقى الحيّ بلا قشرة فارغة", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g", region: "live", heading: "تحويل" })],
    items: [step("a", { groupId: "g", region: "pinned" })],
  });

  const pinned = projectRegion(state, "pinned");
  expect(pinned).toHaveLength(1);
  expect(pinned[0]).toMatchObject({ type: "group", group: { id: "g" } });
  expect(projectRegion(state, "live")).toEqual([]);
});

it("حاوية بلا أعضاء في أيّ منطقة يُرسم عنوانها وحده في الحيّ", () => {
  const state = boardState({ groups: [boardGroup({ id: "g" })] });
  expect(projectRegion(state, "live")).toEqual([
    { type: "group", group: state.groups[0], entries: [] },
  ]);
  expect(projectRegion(state, "pinned")).toEqual([]);
});

it("سجلّ الحاوية المحذوف يترك أعضاءها بلا حاوية", () => {
  const state = boardState({ items: [step("a", { groupId: "gone", region: "pinned" })] });
  expect(projectRegion(state, "pinned")).toEqual([{ type: "item", item: state.items[0] }]);
});

it("الحاويات تبقى في موضع أوّل أعضائها بين جاراتها", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g" })],
    items: [step("a"), step("b", { groupId: "g" }), step("c"), step("d", { groupId: "g" })],
  });
  const kinds = projectRegion(state, "live").map((block) =>
    block.type === "group" ? `group:${block.entries.length}` : "item",
  );
  expect(kinds).toEqual(["item", "group:2", "item"]);
});

it("الإلصاق لا يصحّ إلا لهدفٍ سابق في المنطقة والحاوية نفسيهما", () => {
  const items = [
    icon("a", null, { groupId: "g" }),
    icon("b", "a", { groupId: "g" }),
    icon("far-group", "a", { groupId: "other" }),
    icon("far-region", "a", { groupId: "g", region: "temporary" }),
    icon("missing", "nope", { groupId: "g" }),
    icon("later", "z", { groupId: "g" }),
    icon("z", null, { groupId: "g" }),
    icon("self", "self", { groupId: "g" }),
    boardItem("text", { text: "ليس أيقونة" }, { id: "t", groupId: "g" }),
    icon("to-text", "t", { groupId: "g" }),
  ];

  expect([...validAttachments(items)]).toEqual([["b", "a"]]);
});

it("الأيقونات الملصَقة تتجمّع عند جذرها بترتيب الإضافة", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g", kind: "scenario" })],
    items: [
      icon("a", null, { groupId: "g" }),
      icon("x", null, { groupId: "g" }),
      icon("b", "a", { groupId: "g" }),
      icon("c", "b", { groupId: "g" }),
    ],
  });

  const [group] = projectRegion(state, "live");
  expect(group.type).toBe("group");
  if (group.type !== "group") return;
  expect(
    group.entries.map((entry) =>
      entry.type === "cluster" ? entry.items.map((item) => item.id) : entry.item.id,
    ),
  ).toEqual([["a", "b", "c"], "x"]);
});

it("بعد حذف الهدف تسقط التالية إلى التدفّق العادي وتصير جذر عنقودها", () => {
  const state = boardState({
    groups: [boardGroup({ id: "g", kind: "scenario" })],
    items: [icon("b", "a", { groupId: "g" }), icon("c", "b", { groupId: "g" })],
  });

  expect([...validAttachments(state.items)]).toEqual([["c", "b"]]);
});
