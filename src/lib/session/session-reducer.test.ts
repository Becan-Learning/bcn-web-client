import { describe, expect, it } from "vitest";
import {
  INITIAL_SESSION_STATE,
  checkpointShown,
  parseAgentMessage,
  sessionReducer,
  type SessionState,
} from "./session-reducer";

const checkpoint = { id: "t3-q:1", question: "Question?", choices: ["one", "two"] };
const open = () => sessionReducer(INITIAL_SESSION_STATE, { action: "set_checkpoint", checkpoint });
const idle = { busy: false, startedAt: null };

describe("checkpoint wire state", () => {
  it.each([{ choices: [] }, { choices: ["one", "two"] }])("maps wire text to question with choices $choices", ({ choices }) => {
    expect(parseAgentMessage({
      action: "set_checkpoint", checkpoint: { id: "t3-q:1", text: "", choices },
    })).toEqual({ action: "set_checkpoint", checkpoint: { id: "t3-q:1", question: "", choices } });
  });
  it("accepts null to close the checkpoint", () => {
    expect(parseAgentMessage({ action: "set_checkpoint", checkpoint: null }))
      .toEqual({ action: "set_checkpoint", checkpoint: null });
  });
  it("rejects the retired question action", () => {
    expect(parseAgentMessage({ action: ["set", "question"].join("_"), question: null })).toBeNull();
  });
  it.each([
    { action: "set_topic", topic: "topic", current_topic_index: 1 },
    { action: "set_topic", topic: "topic", current_topic_index: 1, question: "", choices: [{}] },
  ])("accepts set_topic and ignores legacy fields %#", (packet) => {
    expect(parseAgentMessage(packet)).toEqual({ action: "set_topic", topic: "topic", index: 1 });
  });
});

describe("checkpoint state and local handling", () => {
  it("opens, replaces and closes only through set_checkpoint", () => {
    const opened = open();
    expect(opened.checkpoint).toEqual(checkpoint);
    const next = { id: "t3-q:2", question: "Try again?", choices: [] };
    const replaced = sessionReducer(opened, { action: "set_checkpoint", checkpoint: next });
    expect(replaced.checkpoint).toEqual(next);
    expect(sessionReducer(replaced, { action: "set_checkpoint", checkpoint: null }).checkpoint).toBeNull();
  });
  it("keeps the same ask handled on repeated packets, including after null", () => {
    const handled = sessionReducer(open(), { action: "checkpoint_handled", id: checkpoint.id });
    expect(handled.checkpoint).toBe(checkpoint);
    const repeated = sessionReducer(handled, { action: "set_checkpoint", checkpoint: { ...checkpoint } });
    expect(repeated.handledCheckpointId).toBe(checkpoint.id);
    expect(checkpointShown(repeated, "listening", idle)).toBe(false);
    const closed = sessionReducer(repeated, { action: "set_checkpoint", checkpoint: null });
    expect(closed.handledCheckpointId).toBe(checkpoint.id);
    const reopened = sessionReducer(closed, { action: "set_checkpoint", checkpoint });
    expect(checkpointShown(reopened, "listening", idle)).toBe(false);
  });
  it.each([
    { action: "set_topic", topic: "topic", index: 1 } as const,
    { action: "topic_done" } as const,
    { action: "set_lesson", lesson: "new-lesson", totalTopics: 3 } as const,
    { action: "set_lesson", lesson: "old-lesson", totalTopics: 2 } as const,
  ])("progress action $action leaves checkpoint and handled id untouched", (action) => {
    const state: SessionState = {
      ...open(), lesson: { slug: "old-lesson", totalTopics: 2 }, handledCheckpointId: checkpoint.id,
    };
    const next = sessionReducer(state, action);
    expect(next.checkpoint).toBe(state.checkpoint);
    expect(next.handledCheckpointId).toBe(checkpoint.id);
  });
  it("unhandles only the matching id", () => {
    const handled = sessionReducer(open(), { action: "checkpoint_handled", id: checkpoint.id });
    expect(sessionReducer(handled, { action: "checkpoint_unhandled", id: "other:1" })).toBe(handled);
    const unhandled = sessionReducer(handled, { action: "checkpoint_unhandled", id: checkpoint.id });
    expect(unhandled.handledCheckpointId).toBeNull();
    expect(unhandled.checkpoint).toBe(checkpoint);
    expect(checkpointShown(unhandled, "listening", idle)).toBe(true);
  });
  it("reset clears checkpoint and handling while keeping completed lessons", () => {
    const state = { ...open(), handledCheckpointId: checkpoint.id, completedLessons: ["first"] };
    const reset = sessionReducer(state, { action: "session_reset" });
    expect(reset).toEqual({ ...INITIAL_SESSION_STATE, completedLessons: ["first"] });
    expect(reset.checkpoint).toBeNull();
    expect(reset.handledCheckpointId).toBeNull();
    expect(reset.completedLessons).toBe(state.completedLessons);
  });
  it("shows a re-ask with a new id after the previous ask was handled", () => {
    const handled = sessionReducer(open(), { action: "checkpoint_handled", id: checkpoint.id });
    const reasked = sessionReducer(handled, {
      action: "set_checkpoint", checkpoint: { ...checkpoint, id: "t3-q:2" },
    });
    expect(reasked.handledCheckpointId).toBe(checkpoint.id);
    expect(checkpointShown(reasked, "listening", idle)).toBe(true);
  });
});

describe("checkpointShown", () => {
  it("shows an unhandled checkpoint only while listening without a student question", () => {
    expect(checkpointShown(open(), "listening", idle)).toBe(true);
  });
  it("hides without a checkpoint", () => {
    expect(checkpointShown(INITIAL_SESSION_STATE, "listening", idle)).toBe(false);
  });
  it.each(["disconnected", "connecting", "pre-connect-buffering", "initializing", "thinking", "speaking", "failed"])(
    "hides while the agent is %s", (agentState) => {
      expect(checkpointShown(open(), agentState, idle)).toBe(false);
    },
  );
  it.each([
    { busy: true, startedAt: null },
    { busy: false, startedAt: 0 },
    { busy: true, startedAt: 123 },
  ])("hides during a student question with status %j", (status) => {
    expect(checkpointShown(open(), "listening", status)).toBe(false);
  });
  it("hides only the handled id", () => {
    expect(checkpointShown({ ...open(), handledCheckpointId: checkpoint.id }, "listening", idle)).toBe(false);
    expect(checkpointShown({ ...open(), handledCheckpointId: "other:1" }, "listening", idle)).toBe(true);
  });
});
