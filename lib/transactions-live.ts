import type { TransactionRow } from '@/lib/transactions-api';

export type TransactionsDiff = {
  newRows: TransactionRow[];
  changedRowIds: string[];
  nextRowsById: Map<string, TransactionRow>;
};

export function diffTransactions(previousRows: TransactionRow[], nextRows: TransactionRow[]): TransactionsDiff {
  const previousRowsById = new Map(previousRows.map((row) => [row.id, row]));
  const nextRowsById = new Map(nextRows.map((row) => [row.id, row]));

  const newRows = nextRows.filter((row) => !previousRowsById.has(row.id));
  const changedRowIds = nextRows
    .filter((row) => previousRowsById.has(row.id) && previousRowsById.get(row.id)?.status !== row.status)
    .map((row) => row.id);

  return {
    newRows,
    changedRowIds,
    nextRowsById
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
