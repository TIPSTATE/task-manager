import { useState, useEffect } from 'react';
import { formatBusinessDuration, isWithinBusinessHours } from '../lib/businessHours';
import { getActiveLunch } from '../lib/lunchBreaks';
import { useLiveClock } from '../hooks/useLiveClock';

const TEAM = [
  { name: 'Rodrigo', color: '#60a5fa' },
  { name: 'Christian', color: '#c084fc' },
  { name: 'Becario', color: '#34d399' },
];

const FOOD_EMOJIS = ['🍽️', '🥗', '🍲'];

const REST_MESSAGES = [
  'En este momento, tu equipo de desarrollo se encuentra tomando un merecido descanso.',
  'Tu equipo de programadores está descansando por ahora y retomará actividades en cuanto concluya su periodo de descanso.',
  'Actualmente, tu equipo de desarrollo se encuentra fuera de horario laboral, recargando energías para continuar con su trabajo.',
  'Por el momento, tu equipo de programadores está en su periodo de descanso. Agradecemos tu comprensión mientras retoman actividades.',
  'Tu equipo de desarrollo está disfrutando de un momento de descanso para regresar con toda la energía y seguir avanzando en tus proyectos.',
];

const MESSAGE_INTERVAL_MS = 9000;
const FADE_MS = 700;

function RestPeriodMessage() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimeout;

    const interval = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex(prev => (prev + 1) % REST_MESSAGES.length);
        setVisible(true);
      }, FADE_MS);
    }, MESSAGE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <div className="relative bg-[#112d44]/30 border border-[#eeaa28]/15 rounded-3xl px-6 py-10 md:py-14 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #eeaa28 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#eeaa28]/10 border border-[#eeaa28]/20 mb-6">
          <span className="text-xl opacity-70" aria-hidden>☾</span>
        </div>

        <div className="min-h-[5.5rem] md:min-h-[4.5rem] flex items-center justify-center">
          <p
            className={`text-base md:text-lg text-gray-300 leading-relaxed font-light tracking-wide transition-all ease-in-out ${visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-3 blur-[2px]'}`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
          >
            {REST_MESSAGES[index]}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-8">
          {REST_MESSAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-5 bg-[#eeaa28]/60' : 'w-1.5 bg-gray-700'}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamLunchMessage() {
  return (
    <div className="relative bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl px-6 py-10 md:py-14 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #eeaa28 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="flex justify-center items-center gap-8 md:gap-12 mb-8">
          {FOOD_EMOJIS.map((emoji, i) => (
            <span
              key={emoji}
              className="text-4xl md:text-5xl animate-bounce-logo inline-block"
              style={{ animationDelay: `${i * 150}ms` }}
              aria-hidden
            >
              {emoji}
            </span>
          ))}
        </div>

        <p className="text-xl md:text-2xl font-semibold text-[#eeaa28] tracking-tight">
          Tu team está comiendo
        </p>
        <p className="text-sm text-gray-500 mt-3">
          La hora de comida no cuenta en el tiempo de las tareas
        </p>
      </div>
    </div>
  );
}

export default function InProgressSection({
  tasks,
  lunchBreaks,
  getProgressStart,
  getProgressEnd,
}) {
  const now = useLiveClock(lunchBreaks);

  const inBusinessHours = isWithinBusinessHours(now);
  const activeLunch = getActiveLunch(lunchBreaks, now);

  const title = !inBusinessHours
    ? '● Fuera de horario'
    : activeLunch
      ? '● Hora de comida'
      : '● En Progreso';

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold mb-5 px-1 text-[#eeaa28]">{title}</h2>

      {!inBusinessHours ? (
        <RestPeriodMessage />
      ) : activeLunch ? (
        <TeamLunchMessage />
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {TEAM.map(person => {
            const list = tasks.filter(
              t => t.assignedTo === person.name && t.status === 'in-progress'
            );

            return (
              <div key={person.name} className="bg-[#112d44]/30 border border-[#eeaa28]/20 rounded-3xl p-6">
                <h3 className="font-semibold mb-4" style={{ color: person.color }}>
                  📌 {person.name}
                </h3>
                {list.length === 0 ? (
                  <p className="text-gray-500 py-6 text-center">Sin tareas</p>
                ) : (
                  list.map(task => (
                    <div key={task.id} className="bg-[#1a2338] rounded-2xl p-4 mb-3 last:mb-0">
                      <p>{task.text}</p>
                      <p className="text-xs text-[#eeaa28] mt-2">
                        ⏱ {formatBusinessDuration(getProgressStart(task), getProgressEnd(task), lunchBreaks)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
