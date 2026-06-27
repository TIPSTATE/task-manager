const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getISOWeekInfo(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));

  const weekYear = d.getFullYear();
  const week1 = new Date(weekYear, 0, 4);
  const weekNumber = 1 + Math.round(
    ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );

  return { weekYear, weekNumber };
}

export function getMondayOfISOWeek(weekYear, weekNumber) {
  const jan4 = new Date(weekYear, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (weekNumber - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseWeekKey(weekKey) {
  const [year, weekPart] = weekKey.split('-W');
  return { weekYear: Number(year), weekNumber: Number(weekPart) };
}

export function buildWeekKey(weekYear, weekNumber) {
  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
}

export function getWorkdaysOfISOWeek(weekYear, weekNumber) {
  const monday = getMondayOfISOWeek(weekYear, weekNumber);
  const days = [];
  let prevMonth = null;

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const monthChanged = date.getMonth() !== prevMonth;
    prevMonth = date.getMonth();

    days.push({
      date,
      dateKey: toDateKey(date),
      dayName: DAY_NAMES[date.getDay()],
      dayNumber: date.getDate(),
      monthName: MONTH_NAMES[date.getMonth()],
      monthChanged,
    });
  }

  return days;
}

export function getWeekMonthLabel(weekYear, weekNumber) {
  const days = getWorkdaysOfISOWeek(weekYear, weekNumber);
  const firstMonth = days[0].monthName;
  const lastMonth = days[days.length - 1].monthName;
  return firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`;
}

export function getTaskReferenceDate(task) {
  if (task.status === 'in-progress') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  if (task.completedAt) {
    return new Date(task.completedAt);
  }
  return new Date(task.createdAt);
}

export function groupTasksByWeekAndDay(tasks, minWeek = 26) {
  const byWeek = {};

  for (const task of tasks) {
    const date = getTaskReferenceDate(task);
    const { weekYear, weekNumber } = getISOWeekInfo(date);
    if (weekNumber < minWeek) continue;

    const weekKey = buildWeekKey(weekYear, weekNumber);
    const dateKey = toDateKey(date);

    if (!byWeek[weekKey]) {
      byWeek[weekKey] = { weekYear, weekNumber, byDay: {} };
    }
    if (!byWeek[weekKey].byDay[dateKey]) {
      byWeek[weekKey].byDay[dateKey] = [];
    }
    byWeek[weekKey].byDay[dateKey].push(task);
  }

  return byWeek;
}

export function getSortedWeekKeys(grouped, minWeek = 26) {
  const now = new Date();
  const { weekYear: currentYear, weekNumber: currentWeek } = getISOWeekInfo(now);
  const keys = new Set(Object.keys(grouped));

  if (currentWeek >= minWeek) {
    keys.add(buildWeekKey(currentYear, currentWeek));
  }

  return Array.from(keys)
    .map(key => {
      const { weekYear, weekNumber } = parseWeekKey(key);
      return { key, weekYear, weekNumber };
    })
    .filter(({ weekNumber }) => weekNumber >= minWeek)
    .sort((a, b) => b.weekYear - a.weekYear || b.weekNumber - a.weekNumber);
}
