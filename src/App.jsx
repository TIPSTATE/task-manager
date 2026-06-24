import { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('media');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [assignedTo, setAssignedTo] = useState('Rodrigo');
  const [status, setStatus] = useState('pending');

  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !dueDate) return;

    setTasks([{
      id: Date.now(),
      text: newTask.trim(),
      priority,
      dueDate,
      dueTime,
      assignedTo,
      status,
      createdAt: new Date().toISOString()
    }, ...tasks]);

    setNewTask('');
    setPriority('media');
    setStatus('pending');
    setDueTime('12:00');
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
  };

  const deleteTask = (id) => setTasks(tasks.filter(task => task.id !== id));

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    setTasks(tasks.map(task => task.id === editingId ? { ...task, text: editText.trim() } : task));
    setEditingId(null);
    setEditText('');
  };

  const getBusinessHoursElapsed = (createdAt) => {
    const start = new Date(createdAt);
    const now = new Date();
    let totalHours = 0;
    let current = new Date(start);

    while (current < now) {
      const day = current.getDay();
      let workEndHour = (day === 6) ? 13 : 17;
      if (day !== 0) {
        const dayStart = new Date(current); dayStart.setHours(9, 0, 0, 0);
        const dayEnd = new Date(current); dayEnd.setHours(workEndHour, 0, 0, 0);

        const effectiveStart = current > dayStart ? current : dayStart;
        const effectiveEnd = now < dayEnd ? now : dayEnd;

        if (effectiveStart < effectiveEnd) {
          totalHours += (effectiveEnd - effectiveStart) / (1000 * 60 * 60);
        }
      }
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
    return Math.floor(totalHours);
  };

  const getTimeInProgress = (createdAt) => {
    const hours = getBusinessHoursElapsed(createdAt);
    if (hours < 1) return "menos de 1 hora";
    if (hours === 1) return "1 hora";
    if (hours < 8) return `${hours} horas`;
    const days = Math.floor(hours / 8);
    const rem = hours % 8;
    return rem === 0 ? `${days} día${days > 1 ? 's' : ''}` : `${days} día${days > 1 ? 's' : ''} y ${rem} hora${rem > 1 ? 's' : ''}`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  }).filter(task => assigneeFilter === 'all' || task.assignedTo === assigneeFilter);

  const inProgressRodrigo = tasks.filter(t => t.assignedTo === 'Rodrigo' && t.status === 'in-progress');
  const inProgressBecario = tasks.filter(t => t.assignedTo === 'Becario' && t.status === 'in-progress');

  const primaryColor = '#112d44';
  const accentColor = '#eeaa28';

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white pb-12 px-4" style={{ '--primary': primaryColor, '--accent': accentColor }}>
      <div className="max-w-4xl mx-auto">
        {/* Header con Logo */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <img
            src="/LOGO_BLANCOT.png"
            alt="Logo Empresa"
            className="h-16 md:h-20 mb-4 object-contain"
          />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: accentColor }}>
            TaskFlow
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestión de tareas • Horario laboral</p>
        </div>

        {/* En Progreso */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 px-1 flex items-center gap-2" style={{ color: accentColor }}>
            ● En Progreso
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {['Rodrigo', 'Becario'].map(person => {
              const list = person === 'Rodrigo' ? inProgressRodrigo : inProgressBecario;
              return (
                <div key={person} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6 hover:border-[#eeaa28]/40 transition-all">
                  <h3 className="font-semibold mb-4 text-lg" style={{ color: person === 'Rodrigo' ? '#60a5fa' : '#34d399' }}>
                    📌 {person}
                  </h3>
                  {list.length === 0 ? (
                    <p className="text-gray-500 py-8 text-center">Sin tareas activas</p>
                  ) : (
                    list.map(task => (
                      <div key={task.id} className="bg-[#1a2338] rounded-2xl p-4 mb-3 border border-[#eeaa28]/10">
                        <p>{task.text}</p>
                        <p className="text-xs text-[#eeaa28] mt-2">⏱ {getTimeInProgress(task.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={addTask} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6 md:p-8 mb-10">
          <div className="space-y-5">
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="¿Qué tarea vas a agregar?"
              className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-4 text-lg focus:border-[#eeaa28] transition-all"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 focus:border-[#eeaa28]">
                  <option value="pending">Pendiente</option>
                  <option value="in-progress">En Progreso</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Prioridad</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 focus:border-[#eeaa28]">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Hora</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  min="09:00"
                  max={dueDate && new Date(dueDate).getDay() === 6 ? "13:00" : "17:00"}
                  disabled={!dueDate}
                  className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Asignado a</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 text-lg focus:border-[#eeaa28]">
                <option value="Rodrigo">Rodrigo</option>
                <option value="Becario">Becario</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95"
            style={{ backgroundColor: '#eeaa28', color: '#112d44' }}
          >
            + Agregar Tarea
          </button>
        </form>

        {/* Lista de tareas */}
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            const overdue = task.status !== 'completed' && new Date(`${task.dueDate}T${task.dueTime}`) < new Date();
            return (
              <div key={task.id} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6 hover:border-[#eeaa28] transition-all"
                style={{ animationDelay: `${index * 40}ms` }}>
                <div className="flex gap-4">
                  <input type="checkbox" checked={task.status === 'completed'} onChange={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')} className="mt-2 accent-[#eeaa28] w-6 h-6" />

                  <div className="flex-1">
                    {editingId === task.id ? (
                      <input type="text" value={editText} onChange={e => setEditText(e.target.value)} onBlur={saveEdit} className="w-full bg-[#0f1a2e] border border-[#eeaa28] rounded-2xl px-4 py-3" autoFocus />
                    ) : (
                      <p className={`text-[17px] ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.text}</p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <span className={`px-3 py-1 rounded-full text-black font-medium ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                        {task.priority}
                      </span>
                      <span className="text-gray-400">{new Date(task.dueDate).toLocaleDateString('es-MX')} • {task.dueTime}</span>
                      <span>👤 {task.assignedTo}</span>
                      {task.status === 'in-progress' && <span className="text-[#eeaa28]">⏱ {getTimeInProgress(task.createdAt)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xl">
                    {task.status !== 'completed' && <button onClick={() => updateTaskStatus(task.id, 'in-progress')} className="hover:bg-[#eeaa28]/20 p-2 rounded-xl">▶️</button>}
                    <button onClick={() => startEditing(task)} className="hover:bg-gray-700 p-2 rounded-xl">✏️</button>
                    <button onClick={() => deleteTask(task.id)} className="hover:bg-red-900/50 p-2 rounded-xl text-red-400">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;