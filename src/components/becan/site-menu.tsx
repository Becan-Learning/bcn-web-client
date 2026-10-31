"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Link } from "@/i18n/navigation";
import { CloseIcon, MenuIcon } from "./icons";
import { LanguageSwitcher } from "./language-switcher";

/* قائمة الهيدر على الجوال (أقلّ من `md`).

   الهيدر يتّسع عند 320–390px لثلاثة أشياء لا لخمسة: الشعار، ورابط
   الحساب (دخول / مقرراتك — وهو الفعل الذي يحتاجه الزائر دائمًا)،
   وزرّ القائمة. فروابط الأقسام ومبدّل اللغة يسكنان هنا بدل أن
   يتزاحم الخمسة في سطر واحد فيتراكبوا أو ينكسروا سطرًا ثانيًا.

   Radix Dialog للآلية وحدها: حبس التركيز · Escape · البوابة · إعادة
   التركيز إلى الزرّ عند الإغلاق. والمظهر بالتوكنات. اللوحة تنزلق من
   حافة النهاية (يمين في LTR، يسار في RTL — منطقيًا لا بالاتجاه
   الفيزيائي)، وحركتها CSS يُصفّرها `prefers-reduced-motion` عامًّا.

   النقر على رابط يُغلقها: `Dialog.Close asChild` حول الرابط، وإلا
   بقيت اللوحة مفتوحة فوق الصفحة الجديدة أو فوق المقطع المقصود. */
export function SiteMenu({
  nav,
}: {
  nav?: readonly { href: string; label: string }[];
}) {
  const t = useTranslations("SiteHeader");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("menu")}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-pill border border-line text-ink transition-colors hover:bg-surface-2 md:hidden"
        >
          <MenuIcon />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bcn-menu-overlay fixed inset-0 z-40 bg-ground/80" />
        <Dialog.Content
          dir={locale === "ar" ? "rtl" : "ltr"}
          data-theme="light"
          aria-describedby={undefined}
          className="bcn-menu-panel fixed inset-y-0 end-0 z-50 flex w-[min(20rem,calc(100%_-_3rem))] flex-col gap-2 overflow-y-auto border-s border-line bg-ground p-4 shadow-lift"
        >
          <div className="flex items-center justify-between gap-2">
            <Dialog.Title className="ps-2 font-display text-xl font-bold text-ink">
              {t("menu")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-line text-ink transition-colors hover:bg-surface-2"
              >
                <CloseIcon />
              </button>
            </Dialog.Close>
          </div>

          {nav?.length ? (
            <nav className="mt-2 flex flex-col border-t border-line pt-2">
              {nav.map((l) => (
                <Dialog.Close asChild key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-lg font-semibold text-ink hover:bg-surface-2"
                  >
                    {l.label}
                  </Link>
                </Dialog.Close>
              ))}
            </nav>
          ) : null}

          <div className="mt-2 flex border-t border-line pt-4">
            <LanguageSwitcher />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
