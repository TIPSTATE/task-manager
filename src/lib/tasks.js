import { supabase } from './supabase';

function mapTaskFromDb(row) {
  return {
    id: row.id,
    text: row.text,
    priority: row.priority,
    assignedTo: row.assigned_to,
    empresa: row.empresa,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTaskFromDb);
}

export function subscribeToTasks(onTasks, onError) {
  let active = true;

  fetchTasks()
    .then(tasks => {
      if (active) onTasks(tasks);
    })
    .catch(error => {
      console.error('Error al cargar tareas:', error);
      onError?.(error);
    });

  const channel = supabase
    .channel('tasks-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      () => {
        fetchTasks()
          .then(tasks => {
            if (active) onTasks(tasks);
          })
          .catch(error => {
            console.error('Error al sincronizar tareas:', error);
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

export async function createTask(task) {
  const { error } = await supabase.from('tasks').insert({
    text: task.text,
    priority: task.priority,
    assigned_to: task.assignedTo,
    empresa: task.empresa,
    status: 'pending',
  });

  if (error) throw error;
}

export async function updateTask(id, updates) {
  const dbUpdates = {};

  if (updates.text !== undefined) dbUpdates.text = updates.text;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.empresa !== undefined) dbUpdates.empresa = updates.empresa;
  if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);

  if (error) throw error;
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw error;
}
