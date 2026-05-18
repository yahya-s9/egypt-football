/**
 * Fetches Egyptian players (primary citizenship = Egypt, market value > €500k)
 * from Transfermarkt and appends them to the Players sheet.
 *
 * Run:      node scripts/fetch-egypt-players.mjs
 * Dry run:  node scripts/fetch-egypt-players.mjs --dry-run
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath   = path.join(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const SHEET_ID   = process.env.GOOGLE_SHEET_ID;
const API_KEY    = process.env.GOOGLE_API_KEY;
const TM_API     = process.env.TRANSFERMARKT_API_URL ?? "https://transfermarkt-api-8622.onrender.com";
const TOKEN_PATH = path.join(__dirname, "token.json");
const DRY_RUN    = process.argv.includes("--dry-run");
const MIN_VALUE  = 50_000;   // €50k minimum market value
const MAX_PAGES  = 8;
const DELAY_MS   = 800;

const SEARCH_TERMS = [
  "Mohamed", "Ahmed", "Mahmoud", "Mostafa", "Omar",
  "Hassan", "Ibrahim", "Karim", "Amr", "Tarek",
  "Ramadan", "Walid", "Sherif", "Akram", "Ramy",
  "Hamdi", "Marmoush", "Trezeguet", "Zizo", "Salah",
  "Elmohamady", "Kahraba", "Afsha", "Hegazi", "Haissem",
  "Fatouh", "Rabia", "Zaki", "Ghaly", "Gomaa",
];

// ── OAuth ────────────────────────────────────────────────────────────────────
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost:3001"
);

async function ensureAuth() {
  if (fs.existsSync(TOKEN_PATH)) {
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));
    return;
  }
  const url = auth.generateAuthUrl({ access_type: "offline", scope: ["https://www.googleapis.com/auth/spreadsheets"] });
  exec(process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`);
  console.log("Opening browser for authorization…");
  const code = await new Promise(res => {
    const s = http.createServer((req, resp) => {
      const c = new URL(req.url, "http://localhost:3001").searchParams.get("code");
      if (c) { resp.end("✅ Authorized!"); s.close(); res(c); }
    });
    s.listen(3001);
  });
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function tmUrl(name, id) {
  return `https://www.transfermarkt.com/${name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-")}/profil/spieler/${id}`;
}

function mapPosition(pos) {
  if (!pos) return "";
  const p = pos.toLowerCase();
  if (p.includes("goalkeeper"))                               return "GK";
  if (p.includes("back") || p.includes("defender") || p.includes("libero")) return "DEF";
  if (p.includes("winger") || p.includes("forward") || p.includes("striker") || p.includes("second striker")) return "FW";
  if (p.includes("midfield"))                                 return "MF";
  return "";
}

async function get(path) {
  try {
    const res = await fetch(`${TM_API}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchProfile(id) {
  const d = await get(`/players/${id}/profile`);
  if (!d) return {};
  return {
    imageUrl:  d.imageUrl ?? "",
    birthCity: d.placeOfBirth?.city ?? "",
    fullName:  d.nameInHomeCountry?.split(",")[0]?.trim() ?? "",
    position:  mapPosition(d.position?.main ?? ""),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!DRY_RUN) await ensureAuth();

  // Read existing sheet to avoid duplicates
  const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Players?key=${API_KEY}`);
  const { values } = await sheetRes.json();
  const headers   = values[0];
  const tmColIdx  = headers.indexOf("transfermarktUrl");
  const nameIdx   = headers.indexOf("playerName");

  const existingIds   = new Set();
  const existingNames = new Set();
  for (const row of values.slice(1)) {
    const m = row[tmColIdx]?.match(/spieler\/(\d+)/);
    if (m) existingIds.add(m[1]);
    if (row[nameIdx]) existingNames.add(row[nameIdx].trim().toLowerCase());
  }
  console.log(`Existing players: ${values.length - 1}\n`);

  // ── Phase 1: collect candidates via name search ───────────────────────────
  const candidates = new Map(); // id → search result

  for (const term of SEARCH_TERMS) {
    let newCount = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const d = await get(`/players/search/${encodeURIComponent(term)}?page_number=${page}`);
      await sleep(DELAY_MS);
      if (!d) break;

      for (const p of d.results ?? []) {
        // Primary citizenship = Egypt (first in nationalities array)
        if (p.nationalities?.[0] !== "Egypt") continue;
        // Market value threshold
        if ((p.marketValue ?? 0) < MIN_VALUE) continue;
        // Not already in sheet
        if (existingIds.has(p.id)) continue;
        if (existingNames.has(p.name.toLowerCase())) continue;

        if (!candidates.has(p.id)) {
          candidates.set(p.id, p);
          newCount++;
        }
      }
      if (page >= (d.lastPageNumber ?? 1)) break;
    }
    if (newCount > 0) console.log(`  "${term}": +${newCount}`);
  }

  const sorted = [...candidates.values()].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
  console.log(`\nCandidates after filter: ${sorted.length}`);

  if (sorted.length === 0) {
    console.log("Nothing new to add.");
    return;
  }

  // ── Phase 2: fetch profile for each candidate ─────────────────────────────
  console.log(`\nFetching profiles for ${sorted.length} players…`);
  const rows = [];

  for (let i = 0; i < sorted.length; i++) {
    const p       = sorted[i];
    const mv      = `€${(p.marketValue / 1_000_000).toFixed(1)}m`;
    const profile = await fetchProfile(p.id);
    await sleep(DELAY_MS);

    const birthYear = profile.birthCity
      ? (new Date().getFullYear() - p.age)   // approximate
      : "";
    const url = tmUrl(p.name, p.id);

    // Show progress every 5 players
    if (i % 5 === 0 || i === sorted.length - 1) {
      process.stdout.write(`  [${i + 1}/${sorted.length}] ${p.name} (${mv})\n`);
    }

    rows.push([
      p.name,                          // playerName
      profile.fullName || "",          // playerFullName
      profile.position || mapPosition(p.position ?? ""), // position
      birthYear,                       // playerBirthYear
      profile.birthCity,               // playerBirthCity
      "Egypt",                         // playerCountries
      p.club?.name ?? "",              // playerClubs
      "",                              // playerCaps
      "",                              // playerGoals
      profile.imageUrl,                // photoUrl
      url,                             // transfermarktUrl
      "",                              // nickname
    ]);
  }

  console.log(`\nSample (top 10 by market value):`);
  rows.slice(0, 10).forEach(r => console.log(`  ${r[0]} — ${r[4] || "?"} — ${r[10]}`));

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would add ${rows.length} players. Re-run without --dry-run to apply.`);
    return;
  }

  // ── Phase 3: append to sheet ──────────────────────────────────────────────
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Players!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  console.log(`\n✅ Added ${rows.length} Egyptian players to the sheet.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
