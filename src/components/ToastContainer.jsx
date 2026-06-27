const STYLES = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-[#112d44]/95',
    icon: '✓',
    iconColor: 'text-emerald-400',
  },
  error: {
    border: 'border-red-500/40',
    bg: 'bg-[#112d44]/95',
    icon: '!',
    iconColor: 'text-red-400',
  },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(toast => {
        const style = STYLES[toast.type] ?? STYLES.success;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md animate-toast-in ${style.border} ${style.bg}`}
          >
            <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-sm font-bold ${style.iconColor}`}>
              {style.icon}
            </span>
            <p className="text-sm text-gray-100 leading-snug flex-1 pt-0.5">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-gray-500 hover:text-white transition-colors text-lg leading-none px-1"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
