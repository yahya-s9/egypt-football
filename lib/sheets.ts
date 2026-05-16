import { mockSheetData } from "./mockData";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const API_KEY  = process.env.GOOGLE_API_KEY;

type Row = Record<string, string>;

async function fetchFromGoogle(tab: string): Promise<Row[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tab)}?key=${API_KEY}`;
  const res = await fetch(url, {
    next: { tags: ["sheets"], revalidate: 3600 }, // cache for 1hr, bust via revalidateTag
  });
  if (!res.ok) throw new Error(`Sheets API ${res.status} for "${tab}"`);

  const json = await res.json() as { values?: string[][] };
  const { values } = json;
  if (!values || values.length < 2) return [];

  const [headers, ...rows] = values;
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), (row[i] ?? "").trim()]))
  );
}

export async function fetchSheet(tab: string): Promise<Row[]> {
  if (!SHEET_ID) {
    return (mockSheetData[tab] as Row[]) ?? [];
  }
  try {
    const rows = await fetchFromGoogle(tab);
    if (rows.length === 0) {
      return (mockSheetData[tab] as Row[]) ?? [];
    }
    return rows;
  } catch {
    return [];
  }
}
