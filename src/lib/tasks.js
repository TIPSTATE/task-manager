import { supabase } from './supabase';

function mapTaskFromDb(row) {
  return {
    id: row.id,
    text: row.text,
    priority: row.priority,
    dueDate: row.due_date,
    dueTime: row.due_time,
    assignedTo: row.assigned_to,
    empresa: row.empresa,
    status: row.status,
    createdAt: row.created_at,
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
    due_date: task.dueDate,
    due_time: task.dueTime,
    assigned_to: task.assignedTo,
    empresa: task.empresa,
    status: task.status,
  });

  if (error) throw error;
}

export async function updateTask(id, updates) {
  const dbUpdates = {};

  if (updates.text !== undefined) dbUpdates.text = updates.text;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.empresa !== undefined) dbUpdates.empresa = updates.empresa;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);

  if (error) throw error;
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw error;
}
