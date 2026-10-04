/* مدخل عقد السبورة — التفصيل في ./board/

   يُبقي هذا الملفّ اسمه ومكانه لأن CLAUDE.md يسمّيه في جدول هيكل
   المشروع، و`session-reducer.ts` يستورد منه. */

export { parseBoardControlEvent } from "./board/parse";
export { teachingBoardReducer } from "./board/reducer";
export { INITIAL_BOARD_STATE, CALLOUT_KINDS } from "./board/types";
export type {
  BoardPayloadByKind,
  BulletPayload,
  CellState,
  DividerPayload,
  HeadingPayload,
  IconPayload,
  ItemBase,
  Mark,
  MarkScope,
  MarkState,
  NotePayload,
  Pen,
  Stage,
  StepPayload,
  TableCell,
  TimelinePayload,
  TitlePayload,
  UnsupportedPayload,
  AnnotationKind,
  BlanksPayload,
  BoardAction,
  BoardControlEvent,
  BoardGroup,
  BoardItem,
  BoardItemKind,
  BoardPayload,
  BoardRegion,
  BoardScope,
  BoardState,
  CalloutKind,
  CalloutPayload,
  ChainPayload,
  ComparePayload,
  CompareRow,
  DefinitionPayload,
  EquationPayload,
  OptionsPayload,
  SlotState,
  SlotValue,
  TablePayload,
  TermPayload,
  TextPayload,
} from "./board/types";
