import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { NotificationsView } from "./notifications-view";

export const metadata: Metadata = {
  title: "الإشعارات — بيكان",
};

export default function NotificationsPage() {
  return (
    <SettingsShell
      active="notifications"
      title="الإشعارات"
      lede="كل نوع بمفتاحه — ما فيه مفتاح واحد يطفّي كل شيء."
    >
      <NotificationsView />
    </SettingsShell>
  );
}
