export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / (currency === 'krw' || currency === 'jpy' ? 1 : 100));
}
