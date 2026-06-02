import { useEffect, useState } from 'react';
import { fetchDailyQuote, type DailyQuote } from '../services/quoteService';

export interface UseQuoteResult {
  quote: DailyQuote | null;
  isLoading: boolean;
}

// Module-level cache: the quote only changes once a day, so fetch it at most
// once per session and serve it instantly to every mount thereafter.
let cached: DailyQuote | null = null;

/** Returns the daily quote, fetching it once and caching for the session. */
export function useQuote(): UseQuoteResult {
  const [quote, setQuote] = useState<DailyQuote | null>(cached);
  const [isLoading, setIsLoading] = useState(cached === null);

  useEffect(() => {
    if (cached) return;

    let active = true;
    setIsLoading(true);
    fetchDailyQuote()
      .then((result) => {
        if (!active) return;
        if (result) {
          cached = result;
          setQuote(result);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { quote, isLoading };
}
