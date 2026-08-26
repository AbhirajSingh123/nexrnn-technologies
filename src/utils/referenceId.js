// e.g. generateReferenceId('CRS') -> "NRN-CRS-M2K3P9-X7Q1"
export function generateReferenceId(prefix) {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NRN-${prefix}-${time}-${rand}`;
}
