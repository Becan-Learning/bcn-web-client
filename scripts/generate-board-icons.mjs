/* يولّد خريطة اسم بيكان ← اسم لوسيد من كتالوج الأيقونات.

   الكتالوج يملكه الخادم ولا يُعدَّل هنا. فالسكربت يقرؤه كما هو، ويفشل
   إن ذكر أيقونةً لا تحزمها نسخة لوسيد المثبَّتة: أيقونة مفقودة تظهر
   للطالب حاملًا مكان الرسم، والأفضل أن يُكتشف النقص عند البناء.

   التشغيل: node scripts/generate-board-icons.mjs — بعد ترقية لوسيد أو
   تحديث الكتالوج. */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = JSON.parse(
  readFileSync(join(root, "src/lib/session/board/__fixtures__/icons.json"), "utf8"),
);

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("lucide-react/package.json"));
const { default: imports } = await import(
  pathToFileURL(join(packageDir, "dist/esm/dynamicIconImports.mjs")).href
);
const available = new Set(Object.keys(imports));

const map = {};
const missing = [];
for (const entry of catalogue.icons) {
  if (!available.has(entry.lucide)) {
    missing.push(`${entry.name} -> ${entry.lucide}`);
    continue;
  }
  map[entry.name] = entry.lucide;
}

if (missing.length > 0) {
  console.error(
    `lucide-react ${require("lucide-react/package.json").version} lacks ${missing.length} catalogue glyph(s):`,
  );
  for (const line of missing.slice(0, 40)) console.error(`  ${line}`);
  process.exit(1);
}

const body = Object.entries(map)
  .map(([name, lucide]) => `  ${JSON.stringify(name)}: ${JSON.stringify(lucide)},`)
  .join("\n");

const out = `/* مولَّد بـ scripts/generate-board-icons.mjs من كتالوج الأيقونات — لا يُحرَّر يدويًا. */

export const BOARD_ICON_MAP: Readonly<Record<string, string>> = {
${body}
};
`;

writeFileSync(join(root, "src/components/session/board/icon-map.generated.ts"), out);
console.log(`wrote ${Object.keys(map).length} icons`);
