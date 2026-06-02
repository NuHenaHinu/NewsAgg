const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface DailyQuote {
  quote: string;
  author: string;
}

/**
 * Fetch the daily quote from the backend FavQs proxy. The proxy caches the
 * quote server-side (one fetch per day) and hides FAVQS_API_KEY from the
 * client. Returns null on any failure or empty quote so callers can hide the
 * widget rather than render a broken card.
 */
export async function fetchDailyQuote(): Promise<DailyQuote | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/quotes/random`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json.data?.quote) {
      return { quote: json.data.quote, author: json.data.author || 'Unknown' };
    }
    return null;
  } catch {
    return null;
  }
}
