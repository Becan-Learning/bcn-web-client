import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { DataView } from "./data-view";

export const metadata: Metadata = {
  title: "بياناتك — بيكان",
};

/* S4 — بياناتك.

   ⚠️ نظام حماية البيانات الشخصية السعودي (PDPL) يمنح المستخدم حقوقًا
   محدَّدة في الوصول والتصحيح والحذف ومدد التنفيذ — الصياغة والمدد هنا
   تحتاج مراجعة المستشار القانوني قبل النشر. */

export default function DataPage() {
  return (
    <SettingsShell
      active="data"
      title="بياناتك"
      lede="بياناتك لك: تنزّلها متى ما تبي، وتحذفها متى ما تبي."
    >
      <DataView />
    </SettingsShell>
  );
}
