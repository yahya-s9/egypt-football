export type MarketValueEntry = {
  date: string;
  age: number;
  clubName: string;
  marketValue: number; // raw euros
};

export type MarketValueData = {
  currentValue: number;
  history: MarketValueEntry[];
};

export function extractTransfermarktId(url: string): string | null {
  const m = url.match(/spieler\/(\d+)/);
  return m ? m[1] : null;
}

export function formatValue(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `€${m >= 10 ? Math.round(m) : m.toFixed(1)}m`;
  }
  if (v >= 1_000) return `€${Math.round(v / 1_000)}k`;
  return `€${v}`;
}

export async function getMarketValue(id: string): Promise<MarketValueData | null> {
  const base = process.env.TRANSFERMARKT_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/players/${id}/market_value`, {
      next: { revalidate: 86400 }, // cache 24 hrs — market values update infrequently
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      currentValue: json.marketValue ?? 0,
      history: (json.marketValueHistory ?? []).sort(
        (a: MarketValueEntry, b: MarketValueEntry) => a.date.localeCompare(b.date)
      ),
    };
  } catch {
    return null;
  }
}
