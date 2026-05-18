/**
 * Updates playerClubs for every player in the sheet who has a transfermarktUrl.
 * Run:  node scripts/update-all-club-careers.mjs
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(path.join(__dirname, "../.env.local"), "utf8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const SHEET_ID   = process.env.GOOGLE_SHEET_ID;
const API_KEY    = process.env.GOOGLE_API_KEY;
const TM_API     = process.env.TRANSFERMARKT_API_URL;
const TOKEN_PATH = path.join(__dirname, "token.json");
const DELAY_MS   = 900;

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost:3001"
);
auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));

const sleep = ms => new Promise(r => setTimeout(r, ms));

function deriveCareer(transfers) {
  const sorted = [...transfers].sort((a, b) => a.date.localeCompare(b.date));
  const clubs = [], seen = new Set();
  for (const t of sorted) {
    const name = t.clubTo?.name;
    if (!name) continue;
    if (/u\d+|youth|reserve|\bii\b/i.test(name)) continue;
    if (!seen.has(name)) { seen.add(name); clubs.push(name); }
  }
  return clubs;
}

// Read sheet
const sheetRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Players?key=${API_KEY}`
);
const { values } = await sheetRes.json();
const headers  = values[0];
const nameIdx  = headers.indexOf("playerName");
const clubsIdx = headers.indexOf("playerClubs");
const tmIdx    = headers.indexOf("transfermarktUrl");

const players = values.slice(1)
  .map((row, i) => ({ row, rowNum: i + 2, name: row[nameIdx]?.trim(), tm: row[tmIdx]?.trim() }))
  .filter(p => p.name && p.tm);

console.log(`Found ${players.length} players with a Transfermarkt URL.\n`);

const sheets  = google.sheets({ version: "v4", auth });
const updates = [];
const failed  = [];

for (let i = 0; i < players.length; i++) {
  const { name, tm, rowNum } = players[i];
  const tmId = tm.match(/spieler\/(\d+)/)?.[1];
  if (!tmId) { failed.push(`${name} — bad URL`); continue; }

  try {
    const res  = await fetch(`${TM_API}/players/${tmId}/transfers`);
    const data = await res.json();
    await sleep(DELAY_MS);

    const clubs = deriveCareer(data.transfers ?? []);
    if (!clubs.length) { console.log(`  [${i+1}/${players.length}] ${name} — no transfers found, skipping`); continue; }

    const clubsStr = clubs.join(", ");
    updates.push({ rowNum, clubsStr, name });
    console.log(`  [${i+1}/${players.length}] ${name} → ${clubsStr}`);
  } catch (e) {
    failed.push(`${name} — ${e.message}`);
    console.log(`  [${i+1}/${players.length}] ${name} — ERROR: ${e.message}`);
  }
}

if (!updates.length) { console.log("\nNothing to update."); process.exit(0); }

// Batch write
const col   = String.fromCharCode(65 + clubsIdx);
const data  = updates.map(({ rowNum, clubsStr }) => ({
  range: `Players!${col}${rowNum}`,
  values: [[clubsStr]],
}));

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: { valueInputOption: "USER_ENTERED", data },
});

console.log(`\n✅ Updated ${updates.length} players.`);
if (failed.length) { console.log(`\n⚠️  Failed (${failed.length}):`); failed.forEach(f => console.log(`  ${f}`)); }
