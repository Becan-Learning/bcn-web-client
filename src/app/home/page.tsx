import type { Metadata } from "next";
import { HomeView } from "./home-view";

export const metadata: Metadata = {
  title: "مقرراتك — بيكان",
};

/* الشاشة ٨ — الداشبورد `/home`.
   مقصورة الآن على المقررات المسجَّلة والتقدّم فيها. */
export default function HomePage() {
  return <HomeView />;
}
