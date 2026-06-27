import { useState, useEffect } from 'react';
import { getActiveLunch } from '../lib/lunchBreaks';

export function useLiveClock(lunchBreaks = []) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const intervals = [setInterval(update, 60000)];
    const timeouts = [];

    const activeLunch = getActiveLunch(lunchBreaks);
    if (activeLunch) {
      const msUntilEnd = new Date(activeLunch.endsAt).getTime() - Date.now();
      if (msUntilEnd > 0) {
        timeouts.push(setTimeout(update, msUntilEnd + 50));
      }
      intervals.push(setInterval(update, 10000));
    }

    return () => {
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [lunchBreaks]);

  return now;
}
