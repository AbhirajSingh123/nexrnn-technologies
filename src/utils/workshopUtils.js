/**
 * Workshop registration deadline helpers.
 * Deadline ya workshop date/time cross hote hi workshop automatically
 * "Completed" ho jata hai aur nayi registration band ho jati hai.
 * Raw DB rows (snake_case) aur mapped objects (camelCase) dono support karta hai.
 */

function getField(obj, camel, snake) {
  if (!obj) return null;
  return obj[camel] ?? obj[snake] ?? null;
}

export function isRegistrationClosed(workshop) {
  const now = Date.now();

  // Registration deadline cross ho gayi
  const deadlineRaw = getField(workshop, 'registrationDeadline', 'registration_deadline');
  if (deadlineRaw) {
    const deadline = new Date(deadlineRaw);
    if (!Number.isNaN(deadline.getTime()) && now >= deadline.getTime()) return true;
  }

  // Workshop khud ho chuka (date/time pass)
  const wsRaw = getField(workshop, 'workshopDatetime', 'workshop_datetime');
  if (wsRaw) {
    const wsDate = new Date(wsRaw);
    if (!Number.isNaN(wsDate.getTime()) && now >= wsDate.getTime()) return true;
  }

  return false;
}

export function getWorkshopStatus(workshop) {
  return isRegistrationClosed(workshop) ? 'completed' : 'open';
}
