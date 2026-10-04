import { expect, it } from "vitest";
import { boardItem, boardState, renderBoardHtml } from "./test-utils";

it("يرسم عنوان السبورة ونصّها من الحالة", () => {
  const html = renderBoardHtml(
    boardState({
      title: boardItem("title", { text: "عنوان الدرس" }),
      items: [boardItem("text", { text: "نصّ الشرح" })],
    }),
    { language: "Arabic" },
  );
  expect(html).toContain("عنوان الدرس");
  expect(html).toContain("نصّ الشرح");
});
