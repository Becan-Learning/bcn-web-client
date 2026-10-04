"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  EMPTY_RECORDER,
  buildRecording,
  recordPacket,
  type RecorderState,
} from "@/lib/session/board/harness";

/* مسجّل رسائل `ui-control` — عدّة مطوّر لا ميزة للطالب.

   يعمل خارج الإنتاج وبـ`?boardDebug=1` وحدهما، فيحفظ كل رسالة تصل كما
   جاءت ثم يصدّرها بصيغة ملف التجهيزات، فتُشغَّل في عدّة الفحص بـ«استيراد».
   النصّ الظاهر هنا إنجليزي ثابت: استثناء موثّق من `messages/` لأنه أداة
   تطوير لا واجهة طالب. */

const noopSubscribe = () => () => undefined;

function readFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("boardDebug") === "1";
  } catch {
    return false;
  }
}

const readServerFlag = () => false;

export type PacketRecorder = {
  enabled: boolean;
  count: number;
  /** `key` اسم الغرفة: تغيّره يبدأ تسجيلًا جديدًا */
  record: (raw: unknown, key?: string | null) => void;
  download: () => void;
  clear: () => void;
};

export function usePacketRecorder(): PacketRecorder {
  const flagged = useSyncExternalStore(noopSubscribe, readFlag, readServerFlag);
  const enabled = process.env.NODE_ENV !== "production" && flagged;
  const state = useRef<RecorderState>(EMPTY_RECORDER);
  const [count, setCount] = useState(0);

  const record = useCallback(
    (raw: unknown, key: string | null = null) => {
      if (!enabled) return;
      state.current = recordPacket(state.current, raw, key, new Date());
      setCount(state.current.packets.length);
    },
    [enabled],
  );

  const clear = useCallback(() => {
    state.current = EMPTY_RECORDER;
    setCount(0);
  }, []);

  const download = useCallback(() => {
    const recording = buildRecording(state.current);
    const blob = new Blob([JSON.stringify(recording, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${recording.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return { enabled, count, record, download, clear };
}

export function PacketRecorderButtons({ recorder }: { recorder: PacketRecorder }) {
  if (!recorder.enabled) return null;
  const button =
    "inline-flex h-11 items-center rounded-pill border border-line bg-surface px-4 text-sm font-semibold text-ink disabled:opacity-50";
  return (
    <div
      dir="auto"
      lang="en"
      className="fixed start-3 bottom-3 z-50 flex items-center gap-2 rounded-pill border border-line bg-ground p-1.5"
    >
      <span className="ps-3 text-sm text-ink-2" aria-live="polite">
        {recorder.count} packets
      </span>
      <button
        type="button"
        className={button}
        disabled={recorder.count === 0}
        onClick={recorder.download}
      >
        Export JSON
      </button>
      <button
        type="button"
        className={button}
        disabled={recorder.count === 0}
        onClick={recorder.clear}
      >
        Clear
      </button>
    </div>
  );
}
