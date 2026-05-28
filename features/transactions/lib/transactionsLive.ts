// 거래 목록에서 새 거래나 상태 변경을 찾아주는 파일 (이전 서버 스냅샷과 새 서버 스냅샷을 비교해서, “무슨 변화가 있었는지”를 UI가 쓰기 좋은 형태로 바꿔주는 순수 유틸 파일)
import type { TransactionRow } from '@/features/transactions/types/transaction';

export type TransactionsDiff = {
  newRows: TransactionRow[];
  appendedRows: TransactionRow[];
  changedRowIds: string[];
  nextRowsById: Map<string, TransactionRow>;
};
//변화 감지
export function diffTransactions(previousRows: TransactionRow[], nextRows: TransactionRow[]): TransactionsDiff {
  const previousRowsById = new Map(previousRows.map((row) => [row.id, row]));
  const nextRowsById = new Map(nextRows.map((row) => [row.id, row]));
  const { newRows, appendedRows } = splitInsertedRows(previousRows, nextRows, previousRowsById);
  const changedRowIds = nextRows
    .filter((row) => previousRowsById.has(row.id) && previousRowsById.get(row.id)?.status !== row.status)
    .map((row) => row.id);

  return {
    newRows,
    appendedRows,
    changedRowIds,
    nextRowsById
  };
}
//위쪽 새 거래 vs 아래쪽 pagination 구분
function splitInsertedRows(
  previousRows: TransactionRow[],
  nextRows: TransactionRow[],
  previousRowsById: Map<string, TransactionRow>
) {
  if (previousRows.length === 0) {
    return {
      newRows: nextRows,
      appendedRows: [] as TransactionRow[]
    };
  }

  const firstPreviousRowId = previousRows[0]?.id;
  if (!firstPreviousRowId) {
    return {
      newRows: nextRows.filter((row) => !previousRowsById.has(row.id)),
      appendedRows: [] as TransactionRow[]
    };
  }

  const startIndex = nextRows.findIndex((row) => row.id === firstPreviousRowId);
  if (startIndex === -1) {
    return {
      newRows: nextRows.filter((row) => !previousRowsById.has(row.id)),
      appendedRows: [] as TransactionRow[]
    };
  }

  let sharedCount = 0;
  while (
    startIndex + sharedCount < nextRows.length &&
    sharedCount < previousRows.length &&
    nextRows[startIndex + sharedCount]?.id === previousRows[sharedCount]?.id
  ) {
    sharedCount += 1;
  }

  return {
    newRows: nextRows.slice(0, startIndex).filter((row) => !previousRowsById.has(row.id)),
    appendedRows: nextRows.slice(startIndex + sharedCount).filter((row) => !previousRowsById.has(row.id))
  };
}
//화면 맥락 유지하면서 부분 갱신.  (상태 변경은 현재 보이는 행만 안전하게 갱신)
export function preserveVisibleRows(visibleRows: TransactionRow[], diff: TransactionsDiff) {
  return visibleRows.map((row) => diff.nextRowsById.get(row.id) ?? row);
}
//안 보여준 새 거래 큐 정리
export function mergeQueuedRows(currentQueue: TransactionRow[], incomingRows: TransactionRow[]) {
  const seen = new Set<string>();
  const merged: TransactionRow[] = [];

  for (const row of [...incomingRows, ...currentQueue]) {
    if (seen.has(row.id)) {
      continue;
    }

    seen.add(row.id);
    merged.push(row);
  }

  return merged;
}
