import type { Metadata } from "next";
import { SettingsCard, SettingsShell } from "../_shell";
import { SUBSCRIPTION } from "@/lib/data/billing";
import { DeleteForm } from "./delete-form";

export const metadata: Metadata = {
  title: "حذف الحساب — بيكان",
};

/* S4 — حذف الحساب، صفحة منفصلة كما يطلب البريف.

   تشرح **ماذا يُحذف وماذا يبقى ومدة التنفيذ** قبل أي زرّ، فالقرار
   مبنيّ على معرفة لا على تحذير عام.

   ⚠️ المدد هنا (30 يومًا للحذف، 7 أيام للتراجع، مدة حفظ الفواتير)
   تحتاج تثبيتها مع الفريق التقني ومراجعة المستشار القانوني وفق
   نظام حماية البيانات الشخصية. */

const DELETED = [
  "حسابك واسمك وبريدك وجوالك.",
  "جلساتك كلها: وش شرحه لك بيكان، وأسئلتك وإجاباتك، ووين تعثّرت.",
  "تقدّمك في كل مقرر، ومواعيد اختباراتك المحفوظة.",
  "تفضيلاتك وإعدادات إشعاراتك.",
  "أي تسجيل صوتي باقٍ لك عندنا.",
];

const KEPT = [
  "فواتيرك ومبالغ مدفوعاتك — تلزمنا الأنظمة الضريبية بحفظها، وما فيها محتوى مذاكرتك.",
  "بيانات إحصائية مجمَّعة ما ترجع لك ولا تدلّ عليك، مثل عدد الطلاب اللي درسوا فصلًا معيّنًا.",
];

export default function DeletePage() {
  return (
    <SettingsShell
      active="data"
      title="حذف الحساب"
      lede="اقرأ الجزئين تحت قبل ما تقرّر — بعد الحذف ما فيه رجعة."
    >
      <div className="flex flex-col gap-4">
        <SettingsCard title="اللي ينحذف">
          <ul className="mt-3 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
            {DELETED.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </SettingsCard>

        <SettingsCard title="اللي يبقى">
          <ul className="mt-3 flex list-disc flex-col gap-2 ps-5 leading-base text-ink-2">
            {KEPT.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </SettingsCard>

        <SettingsCard title="متى يصير">
          <p className="mt-2 max-w-measure leading-base text-ink-2">
            حسابك يُقفل فورًا ما إن تأكّد الطلب — ما تقدر تدخل بعدها. وبياناتك
            تُحذف من أنظمتنا خلال 30 يومًا، وخلال أول 7 أيام منها تقدر تلغي
            الطلب من الرابط اللي نرسله على بريدك.
          </p>
        </SettingsCard>

        <DeleteForm
          activeUntil={SUBSCRIPTION.canceled ? null : SUBSCRIPTION.renewsOn}
        />
      </div>
    </SettingsShell>
  );
}
