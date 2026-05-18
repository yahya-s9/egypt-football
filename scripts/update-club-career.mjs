/**
 * Pulls a player's full club career from Transfermarkt and updates
 * their playerClubs column in the sheet.
 *
 * Usage:  node scripts/update-club-career.mjs "Mohamed Elneny"
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

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
const API_KEY   = process.env.GOOGLE_API_KEY;
const TM_API    = process.env.TRANSFERMARKT_API_URL;
const TOKEN_PATH = path.join(__dirname, "token.json");

const playerName = process.argv[2];
if (!playerName) {
  console.error('Usage: node scripts/update-club-career.mjs "Player Name"');
  process.exit(1);
}

// ── OAuth (reuse saved token) ─────────────────────────────────────────────────
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost:3001"
);
if (!fs.existsSync(TOKEN_PATH)) {
  console.error("No saved token. Run another script first to authorize.");
  process.exit(1);
}
auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveCareer(transfers, youthClubs) {
  // Sort transfers oldest → newest
  const sorted = [...transfers].sort((a, b) => a.date.localeCompare(b.date));

  // Walk the "to" club of each transfer — this tells us which clubs they joined
  const clubs = [];
  const seen  = new Set();

  // Add youth clubs first (informational only)
  // We skip them since they're youth team entries and the column is for senior career

  for (const t of sorted) {
    const name = t.clubTo?.name;
    if (!name) continue;
    // Skip loan returns that go back to same club already seen at top of list
    // Skip youth/U23 entries
    if (/u\d+|youth|reserve|ii\b/i.test(name)) continue;
    if (!seen.has(name)) {
      seen.add(name);
      clubs.push({ name, season: t.season, date: t.date });
    }
  }

  return clubs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const sheetRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Players?key=${API_KEY}`
);
const { values } = await sheetRes.json();
const headers   = values[0];
const nameIdx   = headers.indexOf("playerName");
const clubsIdx  = headers.indexOf("playerClubs");
const tmIdx     = headers.indexOf("transfermarktUrl");

// Find the player row
const rowIdx = values.findIndex(
  (r, i) => i > 0 && r[nameIdx]?.trim().toLowerCase() === playerName.toLowerCase()
);
if (rowIdx === -1) {
  console.error(`Player "${playerName}" not found in sheet.`);
  process.exit(1);
}

const row   = values[rowIdx];
const tmUrl = row[tmIdx]?.trim();
if (!tmUrl) {
  console.error(`No transfermarktUrl for "${playerName}". Add it to the sheet first.`);
  process.exit(1);
}

const tmId = tmUrl.match(/spieler\/(\d+)/)?.[1];
if (!tmId) {
  console.error("Could not parse Transfermarkt ID from URL:", tmUrl);
  process.exit(1);
}

console.log(`\nFetching transfers for ${playerName} (ID: ${tmId})…`);
const res  = await fetch(`${TM_API}/players/${tmId}/transfers`);
const data = await res.json();

const career = deriveCareer(data.transfers ?? [], data.youthClubs ?? []);

console.log("\nDerived club career:");
career.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.date?.slice(0,4)})`));

const clubsString = career.map(c => c.name).join(", ");
console.log(`\nWill update playerClubs to:\n  "${clubsString}"`);

const sheetRow = rowIdx + 1; // 1-based
const sheets   = google.sheets({ version: "v4", auth });
await sheets.spreadsheets.values.update({
  spreadsheetId: SHEET_ID,
  range: `Players!${String.fromCharCode(65 + clubsIdx)}${sheetRow}`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [[clubsString]] },
});

console.log(`\n✅ Updated "${playerName}" in row ${sheetRow}.`);
