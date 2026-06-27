import { useState } from 'react';
import { startLunchBreak, getTodayLunchBreak } from '../lib/lunchBreaks';
import { isWithinBusinessHours, isWeekday } from '../lib/businessHours';

const LUNCH_PASSWORD = 'genexis321';

export default function LunchBreakButton({ lunchBreaks }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const todayLunch = getTodayLunchBreak(lunchBreaks, now);
  const visible = isWeekday(now) && isWithinBusinessHours(now) && !todayLunch;

  if (!visible) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== LUNCH_PASSWORD) {
      setError('Contraseña incorrecta');
      return;
    }

    setSubmitting(true);
    try {
      await startLunchBreak();
      setShowModal(false);
      setPassword('');
    } catch {
      setError('No se pudo registrar la hora de comida');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
    setError('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full mb-6 py-4 rounded-2xl font-semibold text-lg border-2 border-[#eeaa28]/40 bg-[#eeaa28]/10 text-[#eeaa28] hover:bg-[#eeaa28]/20 transition-all active:scale-[0.98]"
      >
        🍽️ Voy a comer
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleConfirm}
            className="w-full max-w-sm bg-[#112d44] border border-[#eeaa28]/30 rounded-3xl p-6 shadow-2xl"
          >
            <h3 className="text-xl font-semibold text-[#eeaa28] mb-2">Confirmar hora de comida</h3>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Se descontará 1 hora del cálculo de tiempos de todas las tareas. Esta acción no se puede deshacer hoy.
            </p>

            <label className="text-xs text-gray-400 block mb-1.5">Contraseña de confirmación</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0f1a2e] border border-[#eeaa28]/30 rounded-2xl px-4 py-3 mb-2 focus:border-[#eeaa28] outline-none"
              placeholder="Ingresa la contraseña"
              autoFocus
              required
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-3 rounded-2xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: '#eeaa28', color: '#112d44' }}
              >
                {submitting ? 'Registrando…' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
