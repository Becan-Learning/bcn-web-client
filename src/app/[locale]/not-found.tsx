import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import NotFoundContent from "./not-found-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: t("metadataTitle") };
}

export default function NotFound() {
  return <NotFoundContent />;
}
