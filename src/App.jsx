import { useState, useEffect } from 'react';
import { subscribeToTasks, createTask, updateTask, deleteTask } from './lib/tasks';
import { subscribeToLunchBreaks } from './lib/lunchBreaks';
import { formatBusinessDuration, formatDateTime } from './lib/businessHours';
import AlfredoTaskView from './components/AlfredoTaskView';
import InProgressSection from './components/InProgressSection';
import LunchBreakButton from './components/LunchBreakButton';
import ToastContainer from './components/ToastContainer';
import { useLiveClock } from './hooks/useLiveClock';
import { useToast } from './hooks/useToast';

const APP_VERSION = '2.1.0';

const COMPANY_LOGOS = [
  { src: '/LOGO_TIPSTATE.png', alt: 'Tipstate' },
  { src: '/LOGO_EMGISA.png', alt: 'EMGISA' },
  { src: '/LOGO_INMOTEGA.png', alt: 'INMOTEGA' },
];

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [lunchBreaks, setLunchBreaks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('media');
  const [assignedTo, setAssignedTo] = useState('Rodrigo');
  const [empresa, setEmpresa] = useState('Tipstate');

  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [empresaFilter, setEmpresaFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const { toasts, showToast, dismissToast } = useToast();
  useLiveClock(lunchBreaks);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIndex(prev => (prev + 1) % COMPANY_LOGOS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTasks(setTasks);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLunchBreaks(setLunchBreaks);
    return unsubscribe;
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || isAddingTask) return;

    setIsAddingTask(true);
    try {
      await createTask({
        text: newTask.trim(),
        priority,
        assignedTo,
        empresa,
      });

      setNewTask('');
      setPriority('media');
      setAssignedTo('Rodrigo');
      setEmpresa('Tipstate');
      showToast('Tarea creada correctamente');
    } catch {
      showToast('No se pudo crear la tarea', 'error');
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleComplete = async (task) => {
    try {
      if (task.status === 'completed') {
        await updateTask(task.id, { status: 'pending', completedAt: null });
        showToast('Tarea marcada como pendiente');
      } else {
        await updateTask(task.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        showToast('Tarea completada');
      }
    } catch {
      showToast('No se pudo actualizar la tarea', 'error');
    }
  };

  const markInProgress = async (task) => {
    try {
      const updates = { status: 'in-progress' };
      if (!task.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
      await updateTask(task.id, updates);
      showToast('Tarea en progreso');
    } catch {
      showToast('No se pudo iniciar la tarea', 'error');
    }
  };

  const getProgressEnd = (task) => {
    if (task.status === 'completed' && task.completedAt) return task.completedAt;
    return new Date();
  };

  const getProgressStart = (task) => task.startedAt ?? task.createdAt;

  const deleteTaskById = async (id) => {
    try {
      await deleteTask(id);
      showToast('Tarea eliminada');
    } catch {
      showToast('No se pudo eliminar la tarea', 'error');
    }
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingId) return;

    const task = tasks.find(t => t.id === editingId);
    if (task && editText.trim() === task.text) {
      setEditingId(null);
      setEditText('');
      return;
    }

    try {
      await updateTask(editingId, { text: editText.trim() });
      showToast('Tarea actualizada');
    } catch {
      showToast('No se pudo actualizar la tarea', 'error');
    }
    setEditingId(null);
    setEditText('');
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'pending') return task.status !== 'completed';
      if (filter === 'completed') return task.status === 'completed';
      return true;
    })
    .filter(task => assigneeFilter === 'all' || task.assignedTo === assigneeFilter)
    .filter(task => empresaFilter === 'all' || task.empresa === empresaFilter);

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col items-center justify-center px-2 md:px-4 relative">
        <div className="text-center max-w-2xl w-full">
          {/* Logos con animación tipo WhatsApp */}
          <div className="flex justify-center items-center gap-8 md:gap-12 mb-12">
            <img 
              src="/LOGO_TIPSTATE.png" 
              alt="Tipstate" 
              className="h-14 md:h-16 object-contain animate-bounce-logo" 
              style={{ animationDelay: '0ms' }}
            />
            <img 
              src="/LOGO_EMGISA.png" 
              alt="EMGISA" 
              className="h-14 md:h-16 object-contain animate-bounce-logo" 
              style={{ animationDelay: '150ms' }}
            />
            <img 
              src="/LOGO_INMOTEGA.png" 
              alt="INMOTEGA" 
              className="h-14 md:h-16 object-contain animate-bounce-logo" 
              style={{ animationDelay: '300ms' }}
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#eeaa28] mb-3">TaskFlow</h1>
          <p className="text-gray-400 mb-12 text-lg">Sistema de Gestión de Tareas</p>

          <div className="space-y-4 w-full px-6 md:px-0 md:max-w-sm md:mx-auto flex flex-col items-stretch md:items-center">
            <button 
              onClick={() => setCurrentRole('Alfredo')} 
              className="w-full md:w-auto md:min-w-48 bg-[#112d44] hover:bg-[#1a3a5c] border border-[#eeaa28]/30 py-5 rounded-3xl text-xl font-semibold transition-all active:scale-95"
            >
              Alfredo
            </button>
            <button 
              onClick={() => setCurrentRole('Team Dev')} 
              className="w-full md:w-auto md:min-w-48 bg-[#eeaa28] hover:bg-[#f5c15a] text-[#112d44] py-5 rounded-3xl text-xl font-semibold transition-all active:scale-95"
            >
              Team Dev
            </button>
          </div>
        </div>

        <p className="absolute bottom-6 md:bottom-8 text-[10px] md:text-[11px] text-gray-600 font-medium tracking-[0.25em] uppercase select-none">
          v{APP_VERSION}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="pt-5 pb-4 md:pt-6 border-b border-[#eeaa28]/15 mb-2">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <div className="flex items-center justify-center md:justify-start gap-2.5 md:gap-4">
              <img
                key={logoIndex}
                src={COMPANY_LOGOS[logoIndex].src}
                alt={COMPANY_LOGOS[logoIndex].alt}
                className="h-9 w-20 object-contain md:hidden animate-logo-swap"
              />
              <div className="hidden md:flex items-center gap-6">
                {COMPANY_LOGOS.map((logo, i) => (
                  <img
                    key={logo.src}
                    src={logo.src}
                    alt={logo.alt}
                    className="h-10 object-contain animate-bounce-logo"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#eeaa28] tracking-tight">TaskFlow</h1>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#112d44]/80 border border-[#eeaa28]/20 rounded-2xl">
                <span className="text-xs md:text-sm text-gray-400">Rol</span>
                <span className="text-sm md:text-base text-[#eeaa28] font-medium">{currentRole}</span>
              </div>
              <button
                onClick={() => setCurrentRole(null)}
                className="text-xs md:text-sm px-3 py-1.5 md:px-0 md:py-0 text-gray-400 hover:text-white border border-gray-700 md:border-0 rounded-xl md:rounded-none transition-colors"
              >
                Cambiar
              </button>
            </div>
          </div>
        </header>

        {/* En Progreso */}
        <InProgressSection
          tasks={tasks}
          lunchBreaks={lunchBreaks}
          getProgressStart={getProgressStart}
          getProgressEnd={getProgressEnd}
        />

        {currentRole === 'Team Dev' && (
          <LunchBreakButton lunchBreaks={lunchBreaks} onToast={showToast} />
        )}

        {/* Formulario - Solo Team Dev */}
        {currentRole === 'Team Dev' && (
          <form onSubmit={addTask} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6 md:p-8 mb-10">
            <div className="space-y-5">
              <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="¿Qué tarea vas a agregar?" className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-4 text-lg focus:border-[#eeaa28]" required />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Prioridad</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 focus:border-[#eeaa28]">
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Empresa</label>
                  <select value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 focus:border-[#eeaa28]">
                    <option value="Tipstate">Tipstate</option>
                    <option value="EMGISA">EMGISA</option>
                    <option value="INMOTEGA">INMOTEGA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Asignado a</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-5 py-3.5 focus:border-[#eeaa28]">
                  <option value="Rodrigo">Rodrigo</option>
                  <option value="Christian">Christian</option>
                  <option value="Becario">Becario</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingTask || !newTask.trim()}
              className="mt-8 w-full py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ backgroundColor: '#eeaa28', color: '#112d44' }}
            >
              {isAddingTask ? 'Agregando tarea…' : '+ Agregar Tarea'}
            </button>
          </form>
        )}

        {/* Filtros Full Width */}
        <div className="w-full bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-4 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-3">
            <div className="flex flex-wrap justify-center gap-3 md:contents">
              {['all', 'pending', 'completed'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-900 hover:bg-gray-800'}`}>
                  {f === 'all' && 'Todas'}
                  {f === 'pending' && 'Pendientes'}
                  {f === 'completed' && 'Completadas'}
                </button>
              ))}
            </div>

            <div className="flex flex-nowrap justify-center gap-2 w-full md:contents">
              <select value={empresaFilter} onChange={e => setEmpresaFilter(e.target.value)} className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-2xl px-3 py-3 text-xs md:flex-none md:px-5 md:text-sm">
                <option value="all">Todas las empresas</option>
                <option value="Tipstate">Tipstate</option>
                <option value="EMGISA">EMGISA</option>
                <option value="INMOTEGA">INMOTEGA</option>
              </select>

              <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-2xl px-3 py-3 text-xs md:flex-none md:px-5 md:text-sm">
                <option value="all">Todos los asignados</option>
                <option value="Rodrigo">Rodrigo</option>
                <option value="Christian">Christian</option>
                <option value="Becario">Becario</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de tareas */}
        {currentRole === 'Alfredo' ? (
          <AlfredoTaskView
            tasks={filteredTasks}
            lunchBreaks={lunchBreaks}
            getProgressStart={getProgressStart}
            getProgressEnd={getProgressEnd}
          />
        ) : (
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            return (
              <div key={task.id} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6 hover:border-[#eeaa28] transition-all" style={{ animationDelay: `${index * 40}ms` }}>
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => toggleComplete(task)}
                    className="mt-2 accent-[#eeaa28] w-6 h-6"
                  />

                  <div className="flex-1">
                    {editingId === task.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={saveEdit}
                        className="w-full bg-[#0f1a2e] border border-[#eeaa28] rounded-2xl px-4 py-3"
                        autoFocus
                      />
                    ) : (
                      <p className={`text-[17px] ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.text}</p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <span className={`px-3 py-1 rounded-full text-black font-medium ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-yellow-500' : 'bg-green-500'}`}>{task.priority}</span>
                      <span>👤 {task.assignedTo}</span>
                      <span className="text-[#eeaa28]">{task.empresa}</span>
                      {task.status === 'in-progress' && (
                        <span className="text-[#eeaa28]">⏱ {formatBusinessDuration(getProgressStart(task), getProgressEnd(task), lunchBreaks)}</span>
                      )}
                      {task.status === 'completed' && task.completedAt && (
                        <span className="text-green-400">✓ Completada {formatDateTime(task.completedAt)}</span>
                      )}
                      {task.status === 'completed' && task.startedAt && (
                        <span className="text-gray-400">⏱ {formatBusinessDuration(task.startedAt, task.completedAt, lunchBreaks)} en progreso</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end gap-2 mt-6 border-t border-gray-700 pt-4">
                  {task.status !== 'completed' && (
                    <button onClick={() => markInProgress(task)} aria-label="En Progreso" className="px-3 py-2 md:px-5 hover:bg-yellow-900/30 rounded-2xl transition-colors">
                      ▶️<span className="hidden md:inline"> En Progreso</span>
                    </button>
                  )}
                  <button onClick={() => startEditing(task)} aria-label="Editar" className="px-3 py-2 md:px-5 hover:bg-gray-700 rounded-2xl transition-colors">
                    ✏️<span className="hidden md:inline"> Editar</span>
                  </button>
                  <button onClick={() => deleteTaskById(task.id)} aria-label="Eliminar" className="px-3 py-2 md:px-5 hover:bg-red-900/50 text-red-400 rounded-2xl transition-colors">
                    🗑️<span className="hidden md:inline"> Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {currentRole === 'Team Dev' && (
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      )}
    </div>
  );
}

export default App;