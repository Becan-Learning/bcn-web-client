import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { requireAccount } from "@/lib/auth/session";
import { accountReturnPath } from "@/lib/auth/next-path";

/* لا فاتورة بعد — الدفع تجريبي حتى تتوفّر بوابة، فكل رقم فاتورة غير موجود.
   تبقى الحماية بالحساب كي لا يعرف الزائر الفرق بين الصفحتين. */

export default async function InvoicePage(
  props: PageProps<"/[locale]/settings/invoices/[id]">,
) {
  const { locale, id } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAccount(locale, accountReturnPath(`/settings/invoices/${id}`, await props.searchParams));
  notFound();
}
