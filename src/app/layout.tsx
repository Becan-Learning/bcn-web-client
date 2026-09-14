import type { Metadata } from "next";
import { El_Messiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { DirectionProvider } from "@/components/direction-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";

// IBM Plex Sans Arabic is not a variable font, so the weights are
// listed explicitly. The variable is consumed by --bcn-font-sans
// in src/styles/tokens.css.
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* خط العرض — El Messiri، خط الشعار، للعناوين وحدها. */
const elMessiri = El_Messiri({
  variable: "--font-el-messiri",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "بيكان",
  description:
    "بيكان يشرح لك مقررك بصوته، ويسألك عشان يتأكد إنك فهمت، ويعرف وين تنكسر درجتك في الاختبار.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${elMessiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground font-sans">
        <DirectionProvider>{children}</DirectionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
