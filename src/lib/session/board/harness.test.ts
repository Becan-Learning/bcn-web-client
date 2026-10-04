import { describe, expect, it } from "vitest";
import fixtureFile from "./__fixtures__/board-fixtures.json";
import {
  EMPTY_RECORDER,
  UNKNOWN_ICON_NAME,
  buildRecording,
  canDuplicateNext,
  canReplaySnapshot,
  canSwapNext,
  canUseUnknownIcon,
  createPlayer,
  duplicateNext,
  isFinished,
  parseHarnessInput,
  playAll,
  recordPacket,
  replay,
  replaySnapshotAtEqualRev,
  resetPlayer,
  step,
  swapNext,
  withUnknownIcon,
  type HarnessFixture,
} from "./harness";

/* التجهيزات من الخادم، الإيداع 62d9b47، كما هي دون تعديل */
const fixtures = fixtureFile.fixtures as HarnessFixture[];
const named = (name: string) => {
  const fixture = fixtures.find((f) => f.name === name);
  if (!fixture) throw new Error(`missing fixture ${name}`);
  return fixture;
};

describe("replay", () => {
  it("يمرّ كل تجهيز عبر المحلّل والمخفّض دون أن يرمي", () => {
    expect(fixtures).toHaveLength(63);
    for (const fixture of fixtures) {
      expect(() => replay(fixture.messages), fixture.name).not.toThrow();
    }
  });

  it("الخطوة تلو الخطوة وتشغيل الكل ينتهيان حيث ينتهي التشغيل المباشر", () => {
    for (const fixture of fixtures) {
      const direct = replay(fixture.messages);

      let stepped = createPlayer(fixture.messages);
      while (!isFinished(stepped)) stepped = step(stepped);
      expect(stepped.session, fixture.name).toEqual(direct.session);
      expect(stepped.log, fixture.name).toEqual(direct.log);

      const all = playAll(createPlayer(fixture.messages));
      expect(all.session, fixture.name).toEqual(direct.session);
    }
  });

  it("الضبط يعيد الحالة الأولى والطابور الأصلي", () => {
    const fixture = named("progress-events");
    const injected = duplicateNext(step(createPlayer(fixture.messages)));
    const reset = resetPlayer(playAll(injected));
    expect(reset.cursor).toBe(0);
    expect(reset.log).toEqual([]);
    expect(reset.packets).toBe(fixture.messages);
    expect(playAll(reset).session).toEqual(replay(fixture.messages).session);
  });

  it("رسائل التقدّم تصل حالة الجلسة لا السبورة وحدها", () => {
    const { session } = replay(named("progress-events").messages);
    expect(session.lesson?.slug).toBe("units_prefixes_and_conversion");
    expect(session.page).toBe(4);
    expect(session.ending).toBe(true);
  });

  it("رسالة مجهولة أو مشوّهة لا ترمي وتُوسم بأنها غير معروفة", () => {
    const { log } = replay([null, 3, { action: "nope" }, { action: "board_add" }]);
    expect(log).toHaveLength(4);
    expect(log[0].effect).toBe("unrecognised");
    expect(log[2].effect).toBe("unrecognised");
  });
});

describe("fault injection", () => {
  const original = structuredClone(fixtureFile);

  it("التكرار يضيف نسخة تالية ولا يمسّ الأصل", () => {
    const fixture = named("add-heading");
    const player = step(createPlayer(fixture.messages));
    const next = duplicateNext(player);
    expect(next.packets).toHaveLength(fixture.messages.length + 1);
    expect(next.packets[player.cursor]).toEqual(next.packets[player.cursor + 1]);
    expect(next.source).toBe(fixture.messages);
    expect(fixture.messages).toHaveLength(original.fixtures[0].messages.length);
    const done = playAll(next);
    expect(done.log[player.cursor].effect).toBe("applied");
    expect(done.log[player.cursor + 1].effect).toBe("ignored");
    expect(done.session.board.diverged).toBe(false);
  });

  it("التبديل يقلب الرسالتين التاليتين فيظهر الفراغ في المراجعات", () => {
    const fixture = named("add-heading");
    const player = createPlayer(fixture.messages);
    expect(canSwapNext(player)).toBe(true);
    const swapped = swapNext(player);
    expect(swapped.packets[0]).toBe(fixture.messages[1]);
    expect(swapped.packets[1]).toBe(fixture.messages[0]);
    expect(playAll(swapped).session.board.diverged).toBe(true);
  });

  it("لا حقن بلا رسائل متبقّية", () => {
    const done = playAll(createPlayer(named("add-heading").messages));
    expect(canDuplicateNext(done)).toBe(false);
    expect(canSwapNext(done)).toBe(false);
    expect(duplicateNext(done)).toBe(done);
    expect(swapNext(done)).toBe(done);
  });

  it("إعادة اللقطة بالمراجعة نفسها تُدرَج بعد تطبيق لقطة فقط", () => {
    const fixture = named("snapshot-full");
    const fresh = createPlayer(fixture.messages);
    expect(canReplaySnapshot(fresh)).toBe(false);

    const played = playAll(fresh);
    expect(canReplaySnapshot(played)).toBe(true);
    const injected = replaySnapshotAtEqualRev(played);
    const packet = injected.packets[played.cursor] as { action: string; rev: number };
    expect(packet.action).toBe("board_snapshot");
    expect(packet.rev).toBe(played.session.board.rev);
    expect(() => playAll(injected)).not.toThrow();
  });

  it("الأيقونة المجهولة تُستبدل في نسخة من الرسالة القادمة فقط", () => {
    const fixture = named("add-icon");
    const player = createPlayer(fixture.messages);
    expect(canUseUnknownIcon(player)).toBe(true);
    const injected = withUnknownIcon(player);
    const packet = injected.packets.find(
      (p) => (p as { action?: string }).action === "board_add",
    ) as { payload: { icon: string } };
    expect(packet.payload.icon).toBe(UNKNOWN_ICON_NAME);
    expect(
      (fixture.messages.find((p) => (p as { action?: string }).action === "board_add") as {
        payload: { icon: string };
      }).payload.icon,
    ).toBe("ruler");
    expect(canUseUnknownIcon(playAll(player))).toBe(false);
  });

  it("الأيقونة داخل لقطة تُستبدل كذلك", () => {
    const withIcon = {
      name: "x",
      status: "v3",
      description: "",
      covers: [],
      messages: [
        {
          action: "board_snapshot",
          rev: 5,
          visible: true,
          title: null,
          groups: [],
          items: [{ id: "i", kind: "icon", region: "live", payload: { icon: "ruler", label: "L" } }],
        },
      ],
    };
    const injected = withUnknownIcon(createPlayer(withIcon.messages));
    const snapshot = injected.packets[0] as { items: { payload: { icon: string } }[] };
    expect(snapshot.items[0].payload.icon).toBe(UNKNOWN_ICON_NAME);
    expect(
      (withIcon.messages[0] as { items: { payload: { icon: string } }[] }).items[0].payload.icon,
    ).toBe("ruler");
  });

  it("لا يتبدّل ملف التجهيزات بعد كل ما سبق", () => {
    expect(fixtureFile).toEqual(original);
  });
});

describe("recording", () => {
  it("التصدير يعود تجهيزًا قابلًا للتشغيل بالحالة نفسها", () => {
    const source = named("progress-events").messages;
    let state = EMPTY_RECORDER;
    source.forEach((raw, i) => {
      state = recordPacket(state, raw, "room-a", new Date(Date.UTC(2026, 0, 1, 0, 0, i)));
    });

    const exported = buildRecording(state);
    expect(exported.status).toBe("recorded");
    expect(exported.covers).toEqual([]);
    expect(exported.messages).toEqual(source);
    expect(exported.arrivals).toHaveLength(source.length);
    expect(exported.arrivals?.[0]).toMatchObject({ order: 1, action: "board_clear" });

    const loaded = parseHarnessInput(JSON.stringify(exported));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const [fixture] = loaded.fixtures;
    expect(fixture.name).toBe(exported.name);
    expect(fixture.arrivals).toEqual(exported.arrivals);
    expect(playAll(createPlayer(fixture.messages)).session).toEqual(replay(source).session);
  });

  it("الأرقام الناتجة في الوصول هي مراجعة السبورة وعلم التباعد بعد كل رسالة", () => {
    let state = EMPTY_RECORDER;
    for (const raw of [
      { action: "board_clear", scope: "all", rev: 1 },
      { action: "board_show", rev: 4 },
    ]) {
      state = recordPacket(state, raw, "r", new Date(0));
    }
    const { arrivals } = buildRecording(state);
    expect(arrivals?.[0]).toMatchObject({ boardRev: 1, diverged: false });
    expect(arrivals?.[1]).toMatchObject({ rev: 4, diverged: true });
  });

  it("غرفة جديدة تبدأ تسجيلًا جديدًا", () => {
    let state = recordPacket(EMPTY_RECORDER, { action: "board_show", rev: 1 }, "a", new Date(0));
    state = recordPacket(state, { action: "board_show", rev: 2 }, "a", new Date(0));
    expect(state.packets.map((p) => p.order)).toEqual([1, 2]);
    state = recordPacket(state, { action: "board_show", rev: 1 }, "b", new Date(0));
    expect(state.packets).toHaveLength(1);
    expect(state.key).toBe("b");
  });
});

describe("import", () => {
  it("يقبل ملف التجهيزات كاملًا", () => {
    const loaded = parseHarnessInput(JSON.stringify(fixtureFile));
    expect(loaded.ok && loaded.fixtures).toHaveLength(63);
  });

  it("يقبل مصفوفة رسائل عارية", () => {
    const loaded = parseHarnessInput(JSON.stringify([{ action: "board_show", rev: 1 }]));
    expect(loaded.ok && loaded.fixtures[0].status).toBe("recorded");
  });

  it("يرفض ما ليس JSON أو ما لا رسائل فيه", () => {
    expect(parseHarnessInput("{").ok).toBe(false);
    expect(parseHarnessInput('{"a":1}').ok).toBe(false);
    expect(parseHarnessInput('{"fixtures":[{"name":"x"}]}').ok).toBe(false);
    expect(parseHarnessInput("3").ok).toBe(false);
  });
});
