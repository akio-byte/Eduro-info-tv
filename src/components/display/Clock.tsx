import { useEffect, useState, memo } from 'react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

interface ClockProps {
  isLight: boolean;
}

function ClockComponent({ isLight }: ClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className={`text-6xl font-bold tracking-tighter tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {format(now, 'HH:mm')}
      </div>
      <div className={`text-2xl mt-1 capitalize font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        {format(now, 'EEEE, d. MMMM yyyy', { locale: fi })}
      </div>
    </div>
  );
}

export const Clock = memo(ClockComponent);
