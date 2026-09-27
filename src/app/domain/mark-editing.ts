import type { Mark, MarkKind, Marks, Range } from './text-marks';

/** Acrescenta uma marca nova ao tipo indicado, mantendo a lista ordenada pelo início. */
export function addMarkRange(marks: Marks, kind: MarkKind, range: Range): Marks {
  return { ...marks, [kind]: [...marks[kind], range].sort((a, b) => a.start - b.start) };
}

/** Remove só a marca indicada, sem afetar as demais do mesmo tipo. */
export function removeMarkRange(marks: Marks, mark: Mark): Marks {
  const kept = marks[mark.kind].filter((range) => range.start !== mark.start);
  return { ...marks, [mark.kind]: kept };
}
