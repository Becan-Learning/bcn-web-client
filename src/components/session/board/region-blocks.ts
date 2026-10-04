import type {
  BoardGroup,
  BoardItem,
  BoardRegion,
  BoardState,
} from "@/lib/session/teaching-board";

/* إسقاط حالة السبورة على منطقةٍ واحدة — دالّة خالصة تُختبر بلا عرض.

   الحاوية ليست ملكًا لمنطقة أعضائها: التثبيت ينقل العضو وحده ويُبقي
   `groupId` (§2.1)، فتُرسم الحاوية حول أعضائها في كل منطقة تشغلها،
   وتُقرأ هويّتها (العنوان والنوع والمرحلة) من سجلّها أينما كان. وإن
   زال السجلّ بمسح منطقته بقي الأعضاء بلا حاوية ولم يضع أحد. */

/** بند منفرد، أو عنقود أيقوناتٍ ألصق بعضها ببعض عبر `attachTo` */
export type RegionEntry =
  | { type: "item"; item: BoardItem }
  | { type: "cluster"; items: BoardItem[] };

export type RegionBlock =
  | RegionEntry
  | { type: "group"; group: BoardGroup; entries: RegionEntry[] };

/**
 * الإلصاق الصالح: معرّف الأيقونة ← معرّف هدفها.
 *
 * الهدف يجب أن يسبق الأيقونة في الترتيب، وأن يكون أيقونةً في المنطقة
 * نفسها والحاوية نفسها. وما سوى ذلك — هدفٌ محذوف أو في حاوية أخرى أو
 * منطقة أخرى — يسقط إلى التدفّق العادي فلا تُفقد الأيقونة ولا تُعلَّق.
 */
export function validAttachments(items: BoardItem[]): Map<string, string> {
  const position = new Map(items.map((item, index) => [item.id, index]));
  const valid = new Map<string, string>();

  items.forEach((item, index) => {
    if (item.kind !== "icon" || item.payload.attachTo === null) return;
    const targetIndex = position.get(item.payload.attachTo);
    if (targetIndex === undefined || targetIndex >= index) return;
    const target = items[targetIndex];
    if (target.kind !== "icon") return;
    if (target.region !== item.region || target.groupId !== item.groupId) return;
    valid.set(item.id, target.id);
  });

  return valid;
}

/* العنقود يقوم عند جذره: الأيقونة التي لا تلصق بغيرها وتلصق بها أخرى.
   وتنضمّ إليه فروعه كلّها بترتيب الإضافة، فتقف الوحدات بجوار هدفها.
   النتيجة خريطة من معرّف أوّل بند في الإدخال إلى إدخاله؛ والبند الذي
   انضمّ إلى عنقود سابق لا إدخال له لأنه ظهر في عنقوده. */
function arrange(members: BoardItem[], attachments: Map<string, string>): Map<string, RegionEntry> {
  const rootOf = (id: string): string => {
    let current = id;
    while (attachments.has(current)) current = attachments.get(current)!;
    return current;
  };
  const hasDependents = new Set(attachments.values());
  const clusters = new Map<string, BoardItem[]>();
  const entries = new Map<string, RegionEntry>();

  for (const item of members) {
    if (attachments.has(item.id)) {
      const cluster = clusters.get(rootOf(item.id));
      if (cluster) {
        cluster.push(item);
        continue;
      }
    }
    if (hasDependents.has(item.id) && !attachments.has(item.id)) {
      const items = [item];
      clusters.set(item.id, items);
      entries.set(item.id, { type: "cluster", items });
      continue;
    }
    entries.set(item.id, { type: "item", item });
  }

  return entries;
}

/** يرتّب أعضاء قائمةٍ واحدة بحسب ظهورهم، ملصِقًا الأيقونات بأهدافها */
function entriesOf(members: BoardItem[], attachments: Map<string, string>): RegionEntry[] {
  const arranged = arrange(members, attachments);
  return members.flatMap((item) => {
    const entry = arranged.get(item.id);
    return entry ? [entry] : [];
  });
}

export function projectRegion(board: BoardState, region: BoardRegion): RegionBlock[] {
  const regionItems = board.items.filter((item) => item.region === region);
  const attachments = validAttachments(board.items);
  const groupsById = new Map(board.groups.map((group) => [group.id, group]));
  const members = new Map<string, BoardItem[]>();
  const loose = regionItems.filter((item) => !(item.groupId && groupsById.has(item.groupId)));
  const looseEntries = arrange(loose, attachments);
  const blocks: RegionBlock[] = [];

  /* موضع الكتلة هو موضع أوّل ما فيها: الحاوية تصل قبل أعضائها، فتبقى
     بين جاراتها في المكان الذي بدأت فيه لا في آخر المنطقة. */
  for (const item of regionItems) {
    const group = item.groupId ? groupsById.get(item.groupId) : undefined;
    if (!group) {
      const entry = looseEntries.get(item.id);
      if (entry) blocks.push(entry);
      continue;
    }
    const list = members.get(group.id);
    if (list) {
      list.push(item);
    } else {
      members.set(group.id, [item]);
      blocks.push({ type: "group", group, entries: [] });
    }
  }

  for (const block of blocks) {
    if (block.type === "group") {
      block.entries = entriesOf(members.get(block.group.id) ?? [], attachments);
    }
  }

  /* حاوية بلا أعضاء في أيّ منطقة يُرسم عنوانها وحده في الحيّ فقط.
     أمّا إن كان أعضاؤها في منطقة أخرى فقد أُسقطت هناك، وتكرارها فارغةً
     هنا قشرةٌ لا تفيد؛ والمثبَّت والمؤقّت مرجعٌ وتفصيلة فلا يحملان
     عنوانًا بلا محتوى. */
  if (region === "live") {
    const occupied = new Set(board.items.map((item) => item.groupId));
    for (const group of board.groups) {
      if (group.region === "live" && !occupied.has(group.id)) {
        blocks.push({ type: "group", group, entries: [] });
      }
    }
  }

  return blocks;
}

function entryItems(entry: RegionEntry): BoardItem[] {
  return entry.type === "item" ? [entry.item] : entry.items;
}

/** البنود بترتيب ظهورها على الشاشة */
export function blockItems(blocks: RegionBlock[]): BoardItem[] {
  return blocks.flatMap((block) =>
    block.type === "group" ? block.entries.flatMap(entryItems) : entryItems(block),
  );
}

/**
 * ترقيم الخطوات مقصور على المنطقة (§5.1) ويتبع ترتيب الظهور، فلا يرى
 * الطالب ٣ فوق ٢. الحاويات والأنواع الأخرى لا تُرقَّم ولا تقطع العدّ.
 */
export function stepNumbers(blocks: RegionBlock[]): Map<string, number> {
  const numbers = new Map<string, number>();
  let next = 1;
  for (const item of blockItems(blocks)) {
    if (item.kind === "step") numbers.set(item.id, next++);
  }
  return numbers;
}
