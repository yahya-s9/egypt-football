/**
 * Fetches Transfermarkt profile URLs for players who don't have one yet.
 *
 * Run:  node scripts/fetch-transfermarkt-urls.mjs
 * Dry run (no writes): node scripts/fetch-transfermarkt-urls.mjs --dry-run
 *
 * Matching strategy:
 *   1. Search Transfermarkt by playerName
 *   2. Filter results for Egyptian nationality
 *   3. If multiple Egyptian matches, pick highest market value (most notable)
 *   4. If no Egyptian match, try again with nickname (if set)
 *   5. If still no match, skip — mark for manual entry
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const SHEET_ID     = process.env.GOOGLE_SHEET_ID;
const CLIENT_ID    = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET= process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const TM_API       = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api-8622.onrender.com";
const TOKEN_PATH   = path.join(__dirname, "token.json");
const DRY_RUN      = process.argv.includes("--dry-run");
const DELAY_MS     = 1200; // be polite to the API

// Players to skip (uncertain matches — add manually)
const SKIP = new Set([
  "Ahmed Fathy",
  "Mohamed Aboutrika",
  "Hossam Hassan",
  "Ahmed Hassan",
]);

// ── OAuth ────────────────────────────────────────────────────────────────────
import http from "http";
import { exec } from "child_process";

const REDIRECT_PORT = 3001;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}`;
const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function getTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));
    console.log("✓ Using saved OAuth token.");
    return;
  }
  const url = auth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const cmd = process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd);
  console.log("Opening browser for Google authorization…");
  const code = await new Promise((res, rej) => {
    const server = http.createServer((req, resp) => {
      const code = new URL(req.url, `http://localhost:${REDIRECT_PORT}`).searchParams.get("code");
      if (code) { resp.end("✅ Authorized! Return to terminal."); server.close(); res(code); }
      else { resp.end("No code."); rej(new Error("No code")); }
    });
    server.listen(REDIRECT_PORT);
  });
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("✓ Authorized.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildUrl(name, id) {
  const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
  return `https://www.transfermarkt.com/${slug}/profil/spieler/${id}`;
}

async function searchPlayer(query) {
  try {
    const res = await fetch(
      `${TM_API}/players/search/${encodeURIComponent(query)}`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

function bestEgyptMatch(results) {
  const egyptian = results.filter(r =>
    r.nationalities?.some(n => n.toLowerCase().includes("egypt"))
  );
  if (!egyptian.length) return null;
  return egyptian.sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))[0];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!DRY_RUN) await getTokens();

  const sheets = google.sheets({ version: "v4", auth: DRY_RUN ? undefined : auth });

  // Read sheet
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Players?key=${process.env.GOOGLE_API_KEY}`
  );
  const { values } = await readRes.json();
  const headers = values[0];
  const nameIdx = headers.indexOf("playerName");
  const nickIdx = headers.indexOf("nickname");
  const tmIdx   = headers.indexOf("transfermarktUrl");

  const rows = values.slice(1);
  const updates = [];
  const notFound = [];

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Searching ${rows.length} players…\n`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name     = row[nameIdx]?.trim() ?? "";
    const nickname = row[nickIdx]?.trim() ?? "";
    const existing = row[tmIdx]?.trim() ?? "";

    if (!name) continue;
    if (existing) {
      console.log(`  ✓ ${name} — already set`);
      continue;
    }
    if (SKIP.has(name)) {
      console.log(`  ⏭  ${name} — skipped (manual entry needed)`);
      continue;
    }

    // Search by playerName first
    let match = bestEgyptMatch(await searchPlayer(name));
    await sleep(DELAY_MS);

    // Try nickname if no Egyptian match
    if (!match && nickname) {
      console.log(`  ↩ ${name}: no Egypt match, retrying as "${nickname}"…`);
      match = bestEgyptMatch(await searchPlayer(nickname));
      await sleep(DELAY_MS);
    }

    if (match) {
      const url = buildUrl(match.name, match.id);
      const mv  = match.marketValue ? `€${(match.marketValue/1e6).toFixed(1)}m` : "n/a";
      console.log(`  ✓ ${name} → ${match.name} (${match.club?.name}, ${mv})`);
      console.log(`    ${url}`);
      // Sheet row index = i + 2 (1-based, skip header)
      updates.push({ row: i + 2, url });
    } else {
      console.log(`  ✗ ${name} — not found`);
      notFound.push(name);
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Found: ${updates.length}  |  Not found: ${notFound.length}`);

  if (notFound.length) {
    console.log(`\nManual entry needed:`);
    notFound.forEach(n => console.log(`  ${n}`));
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] No changes written. Re-run without --dry-run to apply.`);
    return;
  }

  if (!updates.length) {
    console.log(`\nNothing to update.`);
    return;
  }

  // Write back to sheet — one batch update
  const data = updates.map(({ row, url }) => ({
    range: `Players!K${row}`,
    values: [[url]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });

  console.log(`\n✅ Wrote ${updates.length} URLs to the sheet.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
