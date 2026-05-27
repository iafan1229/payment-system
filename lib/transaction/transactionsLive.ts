// 목록에서 새 거래나 상태 변경을 찾아주는 파일
import type { TransactionRow } from '@/lib/transaction/transactionsApi';

export type TransactionsDiff = {
  newRows: TransactionRow[];
  appendedRows: TransactionRow[];
  changedRowIds: string[];
  nextRowsById: Map<string, TransactionRow>;
};

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

export function preserveVisibleRows(visibleRows: TransactionRow[], diff: TransactionsDiff) {
  return visibleRows.map((row) => diff.nextRowsById.get(row.id) ?? row);
}

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
