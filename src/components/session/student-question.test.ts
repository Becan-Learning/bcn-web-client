import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStudentQuestion } from "./student-question";

function setup() {
  const performRpc = vi.fn<(args: { destinationIdentity: string; method: string; payload: string }) => Promise<string>>(async () => "");
  const setMicrophoneEnabled = vi.fn<(enabled: boolean) => Promise<undefined>>(async () => undefined);
  const onChange = vi.fn();
  const onNoSpeech = vi.fn();
  const onClosed = vi.fn();
  const studentQuestion = createStudentQuestion({ performRpc, setMicrophoneEnabled }, onChange, onNoSpeech, onClosed);
  return { studentQuestion, performRpc, setMicrophoneEnabled, onChange, onNoSpeech, onClosed };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("student question closure outcome", () => {
  it.each(["end_turn", "cancel_turn"] as const)("reports %s once after closing finishes", async (method) => {
    const { studentQuestion, performRpc, onClosed, onChange } = setup();
    await studentQuestion.start("tutor", "listening");
    let acknowledge!: (value: string) => void;
    let reachedRpc!: () => void;
    const rpcStarted = new Promise<void>((resolve) => { reachedRpc = resolve; });
    performRpc.mockImplementationOnce(() => new Promise((resolve) => {
      acknowledge = resolve;
      reachedRpc();
    }));
    const closing = studentQuestion.close(method);
    const duplicate = studentQuestion.close(method);
    await rpcStarted;
    expect(onClosed).not.toHaveBeenCalled();
    acknowledge("");
    await Promise.all([closing, duplicate]);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
    expect(onClosed).toHaveBeenCalledExactlyOnceWith(method === "end_turn" ? "sent" : "cancelled");
    expect(onChange.mock.invocationCallOrder.at(-1)).toBeLessThan(onClosed.mock.invocationCallOrder[0]);
    await studentQuestion.close(method);
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it.each(["thinking", "speaking"] as const)("reports sent when the agent moves to %s after the mic opened", async (agentState) => {
    const { studentQuestion, performRpc, onClosed } = setup();
    await studentQuestion.start("tutor", "listening");
    studentQuestion.observeAgentState(agentState);
    await studentQuestion.close(null);
    expect(performRpc).toHaveBeenCalledTimes(1);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("sent");
  });

  it.each(["end_turn", "cancel_turn", null] as const)("reports cancelled if closed with %s before the mic opened", async (method) => {
    const { studentQuestion, performRpc, onClosed, setMicrophoneEnabled } = setup();
    let acknowledge!: (value: string) => void;
    performRpc.mockImplementationOnce(() => new Promise((resolve) => { acknowledge = resolve; }));
    const opening = studentQuestion.start("tutor", "listening");
    if (method === null) studentQuestion.observeAgentState("thinking");
    const closing = studentQuestion.close(method);
    expect(onClosed).not.toHaveBeenCalled();
    acknowledge("");
    await Promise.all([opening, closing]);
    expect(setMicrophoneEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("cancelled");
  });

  it("reports cancelled when session ending overrides a queued Send", async () => {
    const { studentQuestion, onClosed } = setup();
    await studentQuestion.start("tutor", "listening");
    await Promise.all([studentQuestion.close("end_turn"), studentQuestion.close("cancel_turn")]);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("cancelled");
  });

  it("reports cancelled when cancellation arrives during unmute", async () => {
    const { studentQuestion, onClosed, setMicrophoneEnabled } = setup();
    let unmute!: () => void;
    setMicrophoneEnabled.mockImplementationOnce(() => new Promise((resolve) => { unmute = () => resolve(undefined); }));
    const opening = studentQuestion.start("tutor", "listening");
    await Promise.resolve();
    const closing = studentQuestion.close("cancel_turn");
    unmute();
    await Promise.all([opening, closing]);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("cancelled");
  });

  it("reports cancelled for the no-speech guard and sent for the cap", async () => {
    const { studentQuestion, onClosed } = setup();
    await studentQuestion.start("tutor", "listening");
    await vi.advanceTimersByTimeAsync(8_000);
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("cancelled");
    await studentQuestion.start("tutor", "listening");
    studentQuestion.speechDetected();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onClosed.mock.calls).toEqual([["cancelled"], ["sent"]]);
  });

  it.each(["rpc", "mic"])("reports cancelled when startup fails at %s", async (failure) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { studentQuestion, performRpc, setMicrophoneEnabled, onClosed } = setup();
    if (failure === "rpc") performRpc.mockRejectedValueOnce(new Error("RPC failed"));
    else setMicrophoneEnabled.mockRejectedValueOnce(new Error("Mic lost"));
    await studentQuestion.start("tutor", "listening");
    expect(onClosed).toHaveBeenCalledExactlyOnceWith("cancelled");
  });
});

describe("student question mic gate", () => {
  it("waits for start_turn before unmuting and prevents duplicate starts", async () => {
    const { studentQuestion, performRpc, setMicrophoneEnabled, onChange } = setup();
    let acknowledge!: (value: string) => void;
    performRpc.mockImplementationOnce(() => new Promise((resolve) => { acknowledge = resolve; }));
    const opening = studentQuestion.start("tutor", "speaking");
    await studentQuestion.start("tutor", "speaking");
    expect(performRpc).toHaveBeenCalledExactlyOnceWith({ destinationIdentity: "tutor", method: "start_turn", payload: "" });
    expect(setMicrophoneEnabled).not.toHaveBeenCalled();
    acknowledge("");
    await opening;
    expect(setMicrophoneEnabled).toHaveBeenCalledExactlyOnceWith(true);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: Date.now() });
    await studentQuestion.close("cancel_turn");
  });

  it.each(["end_turn", "cancel_turn"] as const)("mutes on %s and sends the exact contract payload once", async (method) => {
    const { studentQuestion, performRpc, setMicrophoneEnabled, onChange } = setup();
    await studentQuestion.start("tutor", "listening");
    await Promise.all([studentQuestion.close(method), studentQuestion.close(method)]);
    expect(performRpc.mock.calls.map(([args]) => args.method)).toEqual(["start_turn", method]);
    expect(performRpc).toHaveBeenLastCalledWith({ destinationIdentity: "tutor", method, payload: "" });
    expect(setMicrophoneEnabled.mock.calls.map(([enabled]) => enabled)).toEqual([true, false]);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(performRpc).toHaveBeenCalledTimes(2);
  });

  it("ignores lingering speaking until listening has happened in this turn", async () => {
    const { studentQuestion, performRpc } = setup();
    await studentQuestion.start("tutor", "speaking");
    studentQuestion.observeAgentState("speaking");
    expect(performRpc).toHaveBeenCalledTimes(1);
    studentQuestion.observeAgentState("listening");
    studentQuestion.observeAgentState("speaking");
    await studentQuestion.close(null);
    expect(performRpc).toHaveBeenCalledTimes(1); // Automatic close never commits again.
  });

  it("closes on a move to thinking, without sending end_turn", async () => {
    const { studentQuestion, performRpc, setMicrophoneEnabled } = setup();
    await studentQuestion.start("tutor", "speaking");
    studentQuestion.observeAgentState("thinking");
    await studentQuestion.close(null);
    expect(performRpc).toHaveBeenCalledTimes(1);
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
  });

  it("does not treat the initial thinking state as a new turn close", async () => {
    const { studentQuestion, onChange } = setup();
    await studentQuestion.start("tutor", "thinking");
    studentQuestion.observeAgentState("thinking");
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: Date.now() });
    studentQuestion.observeAgentState("listening");
    studentQuestion.observeAgentState("thinking");
    await studentQuestion.close(null);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
  });

  it("cancels a pending start before opening the mic", async () => {
    const { studentQuestion, performRpc, setMicrophoneEnabled } = setup();
    let acknowledge!: (value: string) => void;
    performRpc.mockImplementationOnce(() => new Promise((resolve) => { acknowledge = resolve; }));
    const opening = studentQuestion.start("tutor", "speaking");
    const closing = studentQuestion.close("cancel_turn");
    acknowledge("");
    await Promise.all([opening, closing]);
    expect(setMicrophoneEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(performRpc.mock.calls.map(([args]) => args.method)).toEqual(["start_turn", "cancel_turn"]);
  });

  it("lets session ending override a queued Send", async () => {
    const { studentQuestion, performRpc } = setup();
    await studentQuestion.start("tutor", "listening");
    const sending = studentQuestion.close("end_turn");
    await studentQuestion.close("cancel_turn");
    await sending;
    expect(performRpc.mock.calls.map(([args]) => args.method)).toEqual(["start_turn", "cancel_turn"]);
  });

  it("re-mutes when cancellation arrives during unmute", async () => {
    const { studentQuestion, setMicrophoneEnabled, onChange } = setup();
    let unmute!: () => void;
    setMicrophoneEnabled.mockImplementationOnce(() => new Promise((resolve) => { unmute = () => resolve(undefined); }));
    const opening = studentQuestion.start("tutor", "speaking");
    await Promise.resolve();
    const closing = studentQuestion.close("cancel_turn");
    unmute();
    await Promise.all([opening, closing]);
    expect(setMicrophoneEnabled.mock.calls.map(([enabled]) => enabled)).toEqual([true, false]);
    expect(onChange.mock.calls.every(([status]) => status.startedAt === null)).toBe(true);
  });

  it("clears timers and resets the listening history between student questions", async () => {
    const { studentQuestion, onNoSpeech, onChange } = setup();
    await studentQuestion.start("tutor", "speaking");
    studentQuestion.observeAgentState("listening");
    await studentQuestion.close("end_turn");
    await studentQuestion.start("tutor", "speaking");
    studentQuestion.observeAgentState("speaking");
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: Date.now() });
    await studentQuestion.close("cancel_turn");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onNoSpeech).not.toHaveBeenCalled();
  });
});

describe("student question guards and failures", () => {
  it("cancels at 8 seconds of silence and emits the quiet note", async () => {
    const { studentQuestion, performRpc, onNoSpeech } = setup();
    await studentQuestion.start("tutor", "speaking");
    await vi.advanceTimersByTimeAsync(7_999);
    expect(performRpc).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(onNoSpeech).toHaveBeenCalledOnce();
    expect(performRpc).toHaveBeenLastCalledWith({ destinationIdentity: "tutor", method: "cancel_turn", payload: "" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(performRpc).toHaveBeenCalledTimes(2);
  });

  it("detects audio once, then sends at the 60 second cap", async () => {
    const { studentQuestion, performRpc, onNoSpeech } = setup();
    await studentQuestion.start("tutor", "listening");
    studentQuestion.speechDetected();
    await vi.advanceTimersByTimeAsync(59_999);
    expect(performRpc).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(onNoSpeech).not.toHaveBeenCalled();
    expect(performRpc).toHaveBeenLastCalledWith({ destinationIdentity: "tutor", method: "end_turn", payload: "" });
  });

  it("reverts a failed start without retrying or opening the mic", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { studentQuestion, performRpc, setMicrophoneEnabled, onChange } = setup();
    performRpc.mockRejectedValueOnce(new Error("RPC failed"));
    await studentQuestion.start("tutor", "speaking");
    expect(log).toHaveBeenCalledOnce();
    expect(performRpc).toHaveBeenCalledTimes(1);
    expect(setMicrophoneEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
  });

  it("cancels an acknowledged start if mic unmute fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { studentQuestion, performRpc, setMicrophoneEnabled, onChange } = setup();
    setMicrophoneEnabled.mockRejectedValueOnce(new Error("Mic lost"));
    await studentQuestion.start("tutor", "speaking");
    expect(performRpc.mock.calls.map(([args]) => args.method)).toEqual(["start_turn", "cancel_turn"]);
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
  });

  it.each(["end_turn", "cancel_turn"] as const)("reverts failed %s with the mic muted and no retry", async (method) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { studentQuestion, performRpc, setMicrophoneEnabled, onChange } = setup();
    await studentQuestion.start("tutor", "speaking");
    performRpc.mockRejectedValueOnce(new Error("RPC failed"));
    await studentQuestion.close(method);
    expect(log).toHaveBeenCalledOnce();
    expect(performRpc).toHaveBeenCalledTimes(2);
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenLastCalledWith({ busy: false, startedAt: null });
  });
});
