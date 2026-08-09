import type { HotelCity } from '@ayana/shared-types';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

/** Tiny self-contained mulberry32 PRNG, seeded — avoids adding a shared-utils dependency for one deterministic sequence. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulatedWeather {
  condition: WeatherCondition;
  tempC: number;
  suggestion: string;
}

const CONDITIONS: WeatherCondition[] = ['sunny', 'cloudy', 'rainy'];

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic, seeded-by-city-and-date "forecast" — explicitly simulated, no live weather
 * API call (this prototype stays fully client-side). Same city + date always returns the same
 * result, so it reads as a stable forecast rather than random noise on every render.
 */
export function getSimulatedWeather(city: HotelCity, dateIso: string): SimulatedWeather {
  const day = dateIso.slice(0, 10);
  const rng = seededRandom(hashSeed(`${city}-${day}`));
  const condition = CONDITIONS[Math.floor(rng() * CONDITIONS.length)] ?? 'sunny';
  const tempC = 22 + Math.floor(rng() * 12);

  const suggestion =
    condition === 'rainy'
      ? "Rain's forecast — a good day to keep plans indoors, spa or lounge."
      : condition === 'sunny'
        ? 'Clear skies forecast — a good day for the pool or a walk around the city.'
        : 'Mild, overcast weather forecast — comfortable for sightseeing either way.';

  return { condition, tempC, suggestion };
}

export const WEATHER_ICON: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
};
