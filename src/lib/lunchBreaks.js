import { supabase } from './supabase';

function mapLunchFromDb(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    endsAt: row.ends_at,
  };
}

export async function fetchLunchBreaks() {
  const { data, error } = await supabase
    .from('lunch_breaks')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapLunchFromDb);
}

export function subscribeToLunchBreaks(onBreaks, onError) {
  let active = true;

  fetchLunchBreaks()
    .then(breaks => {
      if (active) onBreaks(breaks);
    })
    .catch(error => {
      console.error('Error al cargar horas de comida:', error);
      onError?.(error);
    });

  const channel = supabase
    .channel('lunch-breaks-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lunch_breaks' },
      () => {
        fetchLunchBreaks()
          .then(breaks => {
            if (active) onBreaks(breaks);
          })
          .catch(error => {
            console.error('Error al sincronizar horas de comida:', error);
            onError?.(error);
          });
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function startLunchBreak() {
  const started = new Date();
  const ends = new Date(started.getTime() + 60 * 60 * 1000);

  const { error } = await supabase.from('lunch_breaks').insert({
    started_at: started.toISOString(),
    ends_at: ends.toISOString(),
  });

  if (error) throw error;
}

export function getTodayLunchBreak(lunchBreaks, date = new Date()) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return lunchBreaks.find(lunch => {
    const started = new Date(lunch.startedAt);
    return started >= dayStart && started < dayEnd;
  }) ?? null;
}

export function getActiveLunch(lunchBreaks, date = new Date()) {
  const now = date.getTime();
  return lunchBreaks.find(lunch => {
    const start = new Date(lunch.startedAt).getTime();
    const end = new Date(lunch.endsAt).getTime();
    return now >= start && now < end;
  }) ?? null;
}
