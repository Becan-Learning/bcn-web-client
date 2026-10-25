import { z } from "zod";

export const toneSchema = z.enum(["lilac", "base", "deep", "amber", "walnut", "olive", "oliveDark"]);
export const iconSchema = z.enum(["coins", "bars", "blocks", "torus", "flask", "atom", "donut", "cube", "bolt"]);
export type Tone = z.infer<typeof toneSchema>;
export type IconKey = z.infer<typeof iconSchema>;

/* قيم العرض غير المعروفة تعود إلى لوحة وأيقونة آمنتين. */
export const safeTone = (value: unknown): Tone => {
  const parsed = toneSchema.safeParse(value);
  return parsed.success ? parsed.data : "lilac";
};
export const safeIcon = (value: unknown): IconKey => {
  const parsed = iconSchema.safeParse(value);
  return parsed.success ? parsed.data : "blocks";
};

export const TONES: Record<
  Tone,
  {
    card: string;
    chapter: string;
    title: string;
    meta: string;
    icon: string;
    chip: string;
    arrow: string;
  }
> = {
  lilac: {
    card: "bg-tint-aubergine border-aubergine-mid",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-aubergine-mid text-aubergine-base",
    arrow: "border-aubergine-mid text-aubergine-base",
  },
  amber: {
    card: "bg-tint-amber border-warmth",
    chapter: "bg-tint-amber border-warmth",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-warmth text-ink",
    arrow: "border-warmth text-ink",
  },
  walnut: {
    card: "bg-tint-walnut border-warmth",
    chapter: "bg-tint-walnut border-warmth",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-aubergine-base",
    chip: "border-warmth text-ink",
    arrow: "border-warmth text-ink",
  },
  olive: {
    card: "bg-olive-tint border-olive",
    chapter: "bg-olive-tint border-olive",
    title: "text-ink",
    meta: "text-ink-2",
    icon: "text-olive-deep",
    chip: "border-olive text-olive-deep",
    arrow: "border-olive text-olive-deep",
  },
  base: {
    card: "bg-aubergine-base border-aubergine-soft",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-on-dominant",
    meta: "text-aubergine-tint",
    icon: "text-aubergine-tint",
    chip: "border-aubergine-soft text-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
  },
  deep: {
    card: "bg-aubergine-deep border-aubergine-mid",
    chapter: "bg-tint-aubergine border-aubergine-mid",
    title: "text-on-dominant",
    meta: "text-aubergine-tint",
    icon: "text-amber-bright",
    chip: "border-aubergine-soft text-aubergine-tint",
    arrow: "border-aubergine-soft text-on-dominant",
  },
  oliveDark: {
    card: "bg-olive-dark border-olive-soft",
    chapter: "bg-olive-tint border-olive",
    title: "text-on-dominant",
    meta: "text-olive-soft",
    icon: "text-olive-soft",
    chip: "border-olive-soft text-olive-soft",
    arrow: "border-olive-soft text-on-dominant",
  },
};

