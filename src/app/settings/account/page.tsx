import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { AccountView } from "./account-view";

export const metadata: Metadata = {
  title: "الحساب — بيكان",
};

export default function AccountPage() {
  return (
    <SettingsShell
      active="account"
      title="الحساب"
      lede="التعديل ينحفظ تلقائيًا أول ما تخرج من الحقل."
    >
      <AccountView />
    </SettingsShell>
  );
}
