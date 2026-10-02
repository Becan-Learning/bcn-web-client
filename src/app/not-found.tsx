import LocaleLayout from "./[locale]/layout";
import LocaleNotFound from "./[locale]/not-found";
import { routing } from "@/i18n/routing";

/* الطلبات المستثناة من proxy قد تصل بلا لغة؛ تُعرض شاشة 404 بالعربية. */
export default function NotFound() {
  return (
    <LocaleLayout params={Promise.resolve({ locale: routing.defaultLocale })}>
      <LocaleNotFound />
    </LocaleLayout>
  );
}
