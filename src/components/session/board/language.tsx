import { createContext, useContext } from "react";
import type { ExplanationLanguage } from "../explanation-language";

/* لغة الشرح تخص اللوح كله، حتى ألفاظ الحالات داخل المقاطع المعزولة. */
const BoardLanguage = createContext<ExplanationLanguage>("Arabic");
export const BoardLanguageProvider = BoardLanguage.Provider;

export function useBoardLanguage(): ExplanationLanguage {
  return useContext(BoardLanguage);
}
