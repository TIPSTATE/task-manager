export function subtractLunchMinutes(segmentStart, segmentEnd, lunchBreaks) {
  let minutes = (segmentEnd - segmentStart) / (1000 * 60);

  for (const lunch of lunchBreaks) {
    const lunchStart = new Date(lunch.startedAt).getTime();
    const lunchEnd = new Date(lunch.endsAt).getTime();
    const overlapStart = Math.max(segmentStart.getTime(), lunchStart);
    const overlapEnd = Math.min(segmentEnd.getTime(), lunchEnd);

    if (overlapStart < overlapEnd) {
      minutes -= (overlapEnd - overlapStart) / (1000 * 60);
    }
  }

  return Math.max(0, minutes);
}

export function getBusinessMinutesElapsed(startAt, endAt = new Date(), lunchBreaks = []) {
  if (!startAt) return 0;

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (start >= end) return 0;

  let totalMinutes = 0;
  let current = new Date(start);

  while (current < end) {
    const day = current.getDay();
    const workEndHour = day === 6 ? 13 : 17;

    if (day !== 0) {
      const dayStart = new Date(current);
      dayStart.setHours(9, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(workEndHour, 0, 0, 0);

      const effectiveStart = current > dayStart ? current : dayStart;
      const effectiveEnd = end < dayEnd ? end : dayEnd;

      if (effectiveStart < effectiveEnd) {
        totalMinutes += subtractLunchMinutes(effectiveStart, effectiveEnd, lunchBreaks);
      }
    }

    const nextDay = new Date(current);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    current = nextDay;
  }

  return Math.round(totalMinutes);
}

export function formatBusinessDuration(startAt, endAt = new Date(), lunchBreaks = []) {
  const totalMinutes = getBusinessMinutesElapsed(startAt, endAt, lunchBreaks);
  if (totalMinutes < 1) return 'menos de 1 minuto';
  if (totalMinutes < 60) {
    return `${totalMinutes} minuto${totalMinutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  if (minutes === 30) {
    if (hours === 0) return 'media hora';
    return hours === 1 ? '1 hora y media' : `${hours} horas y media`;
  }

  const hourPart = hours === 1 ? '1 hora' : `${hours} horas`;
  const minPart = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  return `${hourPart} y ${minPart}`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.toLocaleDateString('es-MX')} • ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

export function isWithinBusinessHours(date = new Date()) {
  const day = date.getDay();
  if (day === 0) return false;

  const workEndHour = day === 6 ? 13 : 17;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = 9 * 60;
  const endMinutes = workEndHour * 60;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function isWeekday(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}
