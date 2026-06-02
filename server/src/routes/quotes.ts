import { Router, Request, Response } from 'express'

// Uses Node's built-in global fetch (Node 18+). CLAUDE.md imported node-fetch
// v3, but that package is ESM-only and breaks under this CommonJS build.

export const quotesRouter = Router()

interface DailyQuote {
  quote: string
  author: string
}

// Server-side daily cache (CLAUDE.md: "refresh once per day"). FavQs' QOTD
// rotates daily, so we key the cache on the UTC date and only re-fetch when the
// day rolls over. In-memory is fine for a single-process server — a restart
// just costs one fresh fetch.
let cache: { date: string; quote: DailyQuote } | null = null

const todayKey = (): string => new Date().toISOString().slice(0, 10)

async function fetchQuoteOfTheDay(): Promise<DailyQuote> {
  const response = await fetch('https://favqs.com/api/qotd', {
    headers: { Authorization: `Token token="${process.env.FAVQS_API_KEY}"` },
  })
  if (!response.ok) throw new Error(`FavQs HTTP ${response.status}`)
  const data = (await response.json()) as any
  return {
    quote: data.quote?.body || '',
    author: data.quote?.author || 'Unknown',
  }
}

quotesRouter.get('/random', async (_req: Request, res: Response) => {
  const today = todayKey()

  if (cache && cache.date === today) {
    return res.json({ success: true, data: cache.quote })
  }

  try {
    const quote = await fetchQuoteOfTheDay()
    cache = { date: today, quote }
    return res.json({ success: true, data: quote })
  } catch (err: any) {
    console.error('[GET /api/quotes/random]', err.message)
    // Serve a stale quote over nothing if a previous day's fetch succeeded.
    if (cache) return res.json({ success: true, data: cache.quote })
    return res.json({ success: false, data: { quote: '', author: '' } })
  }
})
