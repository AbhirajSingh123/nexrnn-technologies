// Parses a display price like "₹4,999" into a plain number: 4999
export function parseRupeeAmount(priceString) {
  const digits = String(priceString ?? '').replace(/[^0-9.]/g, '');
  return Number(digits) || 0;
}
