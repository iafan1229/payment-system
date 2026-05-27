type FormatDateOptions = {
  includeSeconds?: boolean;
};

export function formatDate(value: string, options: FormatDateOptions = {}) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(options.includeSeconds ? { second: '2-digit' } : {})
  });
}
