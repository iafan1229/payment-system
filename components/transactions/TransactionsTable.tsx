import type { TransactionRow } from '@/lib/transactions-api';

type TransactionsTableProps = {
  rows: TransactionRow[];
  onSelect: (id: string) => void;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / (currency === 'krw' || currency === 'jpy' ? 1 : 100));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

type StatusTone = 'success' | 'pending' | 'failed' | 'refunded';

function getStatusTone(status: TransactionRow['status']): StatusTone {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
  }
}

export function TransactionsTable({ rows, onSelect }: TransactionsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="eyebrow">Empty</p>
        <h2>표시할 거래가 아직 없습니다</h2>
        <p className="lead">새 거래가 생성되면 이 목록에 자동으로 반영됩니다.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>고객</th>
            <th>상태</th>
            <th>통화</th>
            <th>금액</th>
            <th>생성 시각</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row.id)} tabIndex={0}>
              <td className="mono">{row.id}</td>
              <td>
                <strong>{row.customer.name}</strong>
                <span>{row.customer.email}</span>
              </td>
              <td>
                <span className={`status-pill status-${getStatusTone(row.status)}`}>{row.status}</span>
              </td>
              <td className="mono">{row.currency.toUpperCase()}</td>
              <td className="amount-cell">{formatAmount(row.amount, row.currency)}</td>
              <td>{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
