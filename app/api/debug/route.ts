export async function GET() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY  = process.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    return Response.json({ error: "Missing env vars", SHEET_ID: !!SHEET_ID, API_KEY: !!API_KEY });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Players?key=${API_KEY}`;

  try {
    const res  = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    return Response.json({
      status:    res.status,
      ok:        res.ok,
      rowCount:  json.values?.length ?? 0,
      headers:   json.values?.[0] ?? null,
      firstRow:  json.values?.[1] ?? null,
      error:     json.error ?? null,
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
