import type { Metadata } from "next";
import { SettingsShell } from "../_shell";
import { StudyView } from "./study-view";

export const metadata: Metadata = {
  title: "تفضيلات المذاكرة — بيكان",
};

export default function StudyPage() {
  return (
    <SettingsShell
      active="study"
      title="تفضيلات المذاكرة"
      lede="قيم البداية لكل جلسة جديدة — وكلها تتغيّر أثناء الشرح نفسه."
    >
      <StudyView />
    </SettingsShell>
  );
}
