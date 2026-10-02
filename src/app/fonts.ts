import { El_Messiri, IBM_Plex_Sans_Arabic } from "next/font/google";

/* الخط ليس متغيّرًا؛ الأوزان صريحة، والتوكن --bcn-font-sans يقرأ متغيّره. */
export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* خط العرض — El Messiri، خط الشعار، للعناوين وحدها. */
export const elMessiri = El_Messiri({
  variable: "--font-el-messiri",
  subsets: ["arabic", "latin"],
  display: "swap",
});
