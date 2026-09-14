import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* لأغلفة Radix الجديدة وحدها. مكوّنات العُدّة المنقولة تبني أصنافها
   شرطيًا ولا تكدّسها (مزلق 8 في docs/STATE.md). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
