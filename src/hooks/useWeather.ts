import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

export function useWeather(lat: number, lon: number, enabled: boolean) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=Europe/Helsinki`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setData({
          temperature: Math.round(json.current.temperature_2m),
          weatherCode: json.current.weather_code,
          isDay: json.current.is_day === 1,
        });
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // refresh every 15 min
    return () => { cancelled = true; clearInterval(interval); };
  }, [lat, lon, enabled]);

  return { data, error };
}

// WMO weather codes → lucide-react icon name + Finnish label
export function weatherCodeToIcon(code: number, isDay: boolean): { icon: string; label: string } {
  if (code === 0) return { icon: isDay ? 'Sun' : 'Moon', label: 'Selkeää' };
  if (code >= 1 && code <= 3) return { icon: isDay ? 'CloudSun' : 'CloudMoon', label: 'Puolipilvistä' };
  if (code === 45 || code === 48) return { icon: 'CloudFog', label: 'Sumua' };
  if (code >= 51 && code <= 57) return { icon: 'CloudDrizzle', label: 'Tihkusadetta' };
  if (code >= 61 && code <= 67) return { icon: 'CloudRain', label: 'Sadetta' };
  if (code >= 71 && code <= 77) return { icon: 'CloudSnow', label: 'Lumisadetta' };
  if (code >= 80 && code <= 82) return { icon: 'CloudRain', label: 'Sadekuuroja' };
  if (code >= 85 && code <= 86) return { icon: 'CloudSnow', label: 'Lumikuuroja' };
  if (code >= 95) return { icon: 'CloudLightning', label: 'Ukkosta' };
  return { icon: 'Cloud', label: '—' };
}
