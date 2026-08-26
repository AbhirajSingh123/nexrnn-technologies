// Parses a display price like "₹4,999" into a plain number: 4999
export function parseRupeeAmount(priceString) {
  const digits = String(priceString ?? '').replace(/[^0-9.]/g, '');
  return Number(digits) || 0;
}

// Always renders a consistent "₹" + comma-grouped number, regardless of
// whether the stored value already has a currency symbol, commas, or is a
// bare number — so the ₹ sign is never missing, doubled, or inconsistent
// no matter what an admin typed into the price field.
export function formatINR(priceValue) {
  const amount = parseRupeeAmount(priceValue);
  return `\u20b9${amount.toLocaleString('en-IN')}`;
}

