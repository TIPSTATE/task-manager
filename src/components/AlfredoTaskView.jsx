import { useState, useMemo, useEffect } from 'react';
import { formatBusinessDuration, formatDateTime } from '../lib/businessHours';
import {
  buildWeekKey,
  getISOWeekInfo,
  getMondayOfISOWeek,
  getSortedWeekKeys,
  getWeekMonthLabel,
  getWorkdaysOfISOWeek,
  groupTasksByWeekAndDay,
  toDateKey,
} from '../lib/isoWeek';

const MIN_WEEK = 26;

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    shortLabel: 'Pend.',
    accent: '#94a3b8',
    cardBorder: 'border-slate-500/25',
    cardBg: 'bg-[#1a2338]/90',
    bar: 'bg-slate-400',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-400/25',
    dot: 'bg-slate-400',
    chip: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    overviewBg: 'from-slate-500/10 to-slate-600/5',
    overviewBorder: 'border-slate-500/20',
    overviewIcon: '○',
  },
  'in-progress': {
    label: 'En progreso',
    shortLabel: 'Progreso',
    accent: '#eeaa28',
    cardBorder: 'border-[#eeaa28]/35',
    cardBg: 'bg-[#1a2338]/95',
    bar: 'bg-[#eeaa28]',
    badge: 'bg-[#eeaa28]/15 text-[#eeaa28] border-[#eeaa28]/40',
    dot: 'bg-[#eeaa28] animate-status-pulse',
    chip: 'bg-[#eeaa28]/15 text-[#eeaa28] border-[#eeaa28]/35',
    overviewBg: 'from-[#eeaa28]/12 to-[#eeaa28]/5',
    overviewBorder: 'border-[#eeaa28]/25',
    overviewIcon: '◉',
  },
  completed: {
    label: 'Completada',
    shortLabel: 'Hecha',
    accent: '#34d399',
    cardBorder: 'border-emerald-500/25',
    cardBg: 'bg-[#1a2338]/80',
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    overviewBg: 'from-emerald-500/10 to-emerald-600/5',
    overviewBorder: 'border-emerald-500/20',
    overviewIcon: '✓',
  },
};

const STATUS_ORDER = ['pending', 'in-progress', 'completed'];

function countByStatus(taskList) {
  return STATUS_ORDER.reduce((acc, status) => {
    acc[status] = taskList.filter(t => t.status === status).length;
    return acc;
  }, {});
}

function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const sizeClass = size === 'lg'
    ? 'px-3 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span className={`inline-flex items-center font-medium tracking-wide uppercase border rounded-full ${sizeClass} ${config.badge}`}>
      <span className={`rounded-full shrink-0 ${size === 'lg' ? 'w-1.5 h-1.5' : 'w-1 h-1'} ${config.dot}`} />
      {config.label}
    </span>
  );
}

function StatusChip({ status, count }) {
  if (count === 0) return null;
  const config = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium tabular-nums border ${config.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {count} {config.shortLabel.toLowerCase()}
    </span>
  );
}

function StatusOverview({ tasks }) {
  const counts = useMemo(() => countByStatus(tasks), [tasks]);
  const total = tasks.length;

  if (total === 0) return null;

  const segments = STATUS_ORDER.map(status => ({
    status,
    count: counts[status],
    pct: total > 0 ? (counts[status] / total) * 100 : 0,
  })).filter(s => s.count > 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-gray-400 tracking-wide uppercase">Estado general</h2>
        <span className="text-xs text-gray-500 tabular-nums">{total} tarea{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {STATUS_ORDER.map(status => {
          const config = STATUS_CONFIG[status];
          const count = counts[status];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={status}
              className={`relative overflow-hidden aspect-square md:aspect-auto rounded-xl md:rounded-2xl border bg-gradient-to-br ${config.overviewBg} ${config.overviewBorder} p-2 sm:p-3 md:p-5 flex flex-col min-h-0`}
            >
              <div className="flex items-start justify-between gap-1 md:gap-2 shrink-0">
                <p className="text-[8px] sm:text-[9px] md:text-[11px] font-medium tracking-[0.08em] md:tracking-[0.12em] uppercase text-gray-500 leading-tight">
                  <span className="md:hidden">{config.shortLabel}</span>
                  <span className="hidden md:inline">{config.label}</span>
                </p>
                <span
                  className="text-sm md:text-2xl opacity-40 leading-none shrink-0 hidden sm:block"
                  style={{ color: config.accent }}
                  aria-hidden
                >
                  {config.overviewIcon}
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center min-h-0 w-full py-0.5 md:py-2">
                <p
                  className="font-bold tabular-nums leading-none text-center md:text-left w-full text-[clamp(2.75rem,15vw,4.5rem)] sm:text-7xl md:text-4xl tracking-tight"
                  style={{ color: config.accent }}
                >
                  {count}
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 shrink-0">
                <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] md:text-[10px] text-gray-500 tabular-nums text-center md:text-right md:w-8 shrink-0">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {segments.length > 1 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-800/80">
          {segments.map(({ status, pct }) => (
            <div
              key={status}
              className={`h-full transition-all duration-500 ${STATUS_CONFIG[status].bar}`}
              style={{ width: `${pct}%` }}
              title={`${STATUS_CONFIG[status].label}: ${Math.round(pct)}%`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlfredoTaskCard({ task, lunchBreaks, getProgressStart, getProgressEnd }) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.cardBorder} ${config.cardBg}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} aria-hidden />

      <div className="pl-4 pr-4 py-3.5 md:pl-5 md:pr-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <StatusBadge status={task.status} size="lg" />
          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${task.priority === 'alta' ? 'bg-red-500/20 text-red-400' : task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
            {task.priority}
          </span>
        </div>

        <p className={`text-[15px] leading-snug pr-2 ${task.status === 'completed' ? 'text-gray-400 line-through decoration-gray-600' : 'text-white'}`}>
          {task.text}
        </p>

        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-gray-400">👤 {task.assignedTo}</span>
            <span className="text-[#eeaa28]/75">{task.empresa}</span>
            {task.status === 'pending' && (
              <span className="text-gray-600 italic">Pendiente de inicio</span>
            )}
          </div>

          {task.status === 'in-progress' && (
            <p className="text-[11px] leading-relaxed">
              <span className="text-gray-600 font-medium tracking-wide">Tiempo en curso</span>
              <span className="text-gray-700 mx-1.5">·</span>
              <span className="text-[#eeaa28]/80 tabular-nums">
                {formatBusinessDuration(getProgressStart(task), getProgressEnd(task), lunchBreaks)}
              </span>
            </p>
          )}

          {task.status === 'completed' && task.completedAt && (
            <p className="text-[11px] text-gray-600 leading-relaxed">
              <span className="font-medium tracking-wide">Finalizada</span>
              <span className="mx-1.5">·</span>
              <span className="text-gray-500 tabular-nums">{formatDateTime(task.completedAt)}</span>
            </p>
          )}

          {task.status === 'completed' && task.startedAt && task.completedAt && (
            <p className="text-[11px] leading-relaxed">
              <span className="text-gray-600 font-medium tracking-wide">Tiempo invertido</span>
              <span className="text-gray-700 mx-1.5">·</span>
              <span className="text-emerald-400/70 tabular-nums">
                {formatBusinessDuration(task.startedAt, task.completedAt, lunchBreaks)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DayStatusDots({ tasks }) {
  const present = STATUS_ORDER.filter(status => tasks.some(t => t.status === status));
  if (present.length === 0) return null;

  return (
    <div className="flex items-center gap-1 ml-auto mr-1">
      {present.map(status => (
        <span
          key={status}
          className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status].dot}`}
          title={STATUS_CONFIG[status].label}
        />
      ))}
    </div>
  );
}

export default function AlfredoTaskView({ tasks, lunchBreaks, getProgressStart, getProgressEnd }) {
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setTodayKey(toDateKey(new Date())), 60000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => groupTasksByWeekAndDay(tasks, MIN_WEEK), [tasks, todayKey]);
  const weekEntries = useMemo(() => getSortedWeekKeys(grouped, MIN_WEEK), [grouped, todayKey]);

  const currentWeekKey = useMemo(() => {
    const { weekYear, weekNumber } = getISOWeekInfo(new Date());
    return weekNumber >= MIN_WEEK ? buildWeekKey(weekYear, weekNumber) : null;
  }, []);

  const [openWeeks, setOpenWeeks] = useState(() =>
    currentWeekKey ? new Set([currentWeekKey]) : new Set()
  );

  const toggleWeek = (weekKey) => {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      return next;
    });
  };

  if (weekEntries.length === 0) {
    return (
      <>
        <StatusOverview tasks={tasks} />
        <div className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-10 text-center text-gray-500">
          No hay tareas desde la semana {MIN_WEEK}.
        </div>
      </>
    );
  }

  return (
    <div>
      <StatusOverview tasks={tasks} />

      <div className="space-y-3">
        {weekEntries.map(({ key, weekYear, weekNumber }) => {
          const isOpen = openWeeks.has(key);
          const weekData = grouped[key];
          const workdays = getWorkdaysOfISOWeek(weekYear, weekNumber);
          const monthLabel = getWeekMonthLabel(weekYear, weekNumber);
          const weekTasks = weekData
            ? Object.values(weekData.byDay).flat()
            : [];
          const weekCounts = countByStatus(weekTasks);
          const taskCount = weekTasks.length;

          return (
            <div
              key={key}
              className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl overflow-hidden transition-colors hover:border-[#eeaa28]/35"
            >
              <button
                type="button"
                onClick={() => toggleWeek(key)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 md:px-6 md:py-5 text-left transition-colors hover:bg-[#112d44]/50"
                aria-expanded={isOpen}
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="text-lg md:text-xl font-semibold text-[#eeaa28] shrink-0">
                    Semana {weekNumber}
                  </span>
                  <span className="text-[11px] md:text-xs text-gray-500 font-medium tracking-[0.15em] uppercase truncate">
                    {monthLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_ORDER.map(status => (
                      <StatusChip key={status} status={status} count={weekCounts[status]} />
                    ))}
                  </div>
                  {taskCount > 0 && (
                    <span className="text-xs text-gray-500 tabular-nums hidden sm:inline">
                      {taskCount} total
                    </span>
                  )}
                  <span
                    className={`text-[#eeaa28]/70 text-xl leading-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#eeaa28]/10 px-4 pb-4 md:px-5 md:pb-5">
                  <div className="space-y-1 pt-3">
                    {workdays.map((day, index) => {
                      const dayTasks = weekData?.byDay[day.dateKey] ?? [];
                      const showMonth = index === 0 || day.monthChanged;

                      return (
                        <div key={day.dateKey} className="rounded-2xl overflow-hidden">
                          <div className="flex items-baseline gap-2 px-3 py-2.5 md:px-4">
                            <span className="text-sm font-medium text-gray-300 w-20 md:w-24 shrink-0">
                              {day.dayName}
                            </span>
                            <span className="text-base font-semibold text-white tabular-nums">
                              {day.dayNumber}
                            </span>
                            {showMonth && (
                              <span className="text-[10px] text-gray-600 font-medium tracking-widest uppercase ml-0.5">
                                {day.monthName}
                              </span>
                            )}
                            <DayStatusDots tasks={dayTasks} />
                          </div>

                          {dayTasks.length > 0 ? (
                            <div className="space-y-2 px-2 pb-3 md:px-3">
                              {dayTasks.map(task => (
                                <AlfredoTaskCard
                                  key={task.id}
                                  task={task}
                                  lunchBreaks={lunchBreaks}
                                  getProgressStart={getProgressStart}
                                  getProgressEnd={getProgressEnd}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600 px-3 pb-3 md:px-4">Sin tareas</p>
                          )}
                        </div>
                      );
                    })}

                    {(() => {
                      const monday = getMondayOfISOWeek(weekYear, weekNumber);
                      const sunday = new Date(monday);
                      sunday.setDate(monday.getDate() + 6);
                      const sundayKey = toDateKey(sunday);
                      const sundayTasks = weekData?.byDay[sundayKey] ?? [];

                      if (sundayTasks.length === 0) return null;

                      return (
                        <div className="rounded-2xl overflow-hidden mt-1">
                          <div className="flex items-baseline gap-2 px-3 py-2.5 md:px-4">
                            <span className="text-sm font-medium text-gray-500 w-20 md:w-24 shrink-0">Domingo</span>
                            <span className="text-base font-semibold text-gray-400 tabular-nums">
                              {sunday.getDate()}
                            </span>
                            <DayStatusDots tasks={sundayTasks} />
                          </div>
                          <div className="space-y-2 px-2 pb-3 md:px-3">
                            {sundayTasks.map(task => (
                              <AlfredoTaskCard
                                key={task.id}
                                task={task}
                                lunchBreaks={lunchBreaks}
                                getProgressStart={getProgressStart}
                                getProgressEnd={getProgressEnd}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
