import { describe, expect, it } from "vitest";
import { iconSchema, safeIcon, safeTone, toneSchema, TONES } from "./presentation";

describe("course presentation", () => {
  it.each(toneSchema.options)("preserves the supported tone %s", (tone) => {
    expect(safeTone(tone)).toBe(tone);
    expect(TONES[tone].card).toBeTruthy();
  });
  it.each(iconSchema.options)("preserves the supported icon %s", (icon) => {
    expect(safeIcon(icon)).toBe(icon);
  });
  it.each(["unknown", "__proto__", "constructor", "", null, undefined, 1, {}])("uses safe presentation defaults for %j", (value) => {
    expect(safeTone(value)).toBe("lilac");
    expect(safeIcon(value)).toBe("blocks");
  });
});
