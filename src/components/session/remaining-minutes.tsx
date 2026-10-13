import { useFormatter, useTranslations } from "next-intl";

export function RemainingMinutes({ count }: { count: number }) {
  const t = useTranslations("Session");
  const format = useFormatter();
  return (
    <p className="mt-2 max-w-measure text-sm leading-base text-ink-2">
      {t("minutesRemaining", { count, countLabel: format.number(count, { numberingSystem: "latn" }) })}
    </p>
  );
}
