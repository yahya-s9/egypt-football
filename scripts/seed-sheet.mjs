/**
 * Seeds the Egyptian Football Google Sheet with demo data.
 *
 * Run once:  node scripts/seed-sheet.mjs
 *
 * On first run it opens a browser for Google sign-in, then writes all data.
 * Subsequent runs reuse the saved token (token.json in this folder).
 */

import { google } from "googleapis";
import http from "http";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const SHEET_ID     = process.env.GOOGLE_SHEET_ID;
const CLIENT_ID    = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET= process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_PORT= 3001;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const TOKEN_PATH   = path.join(__dirname, "token.json");

// ── OAuth2 setup ─────────────────────────────────────────────────────────────
const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function getTokens() {
  // Reuse saved token if present
  if (fs.existsSync(TOKEN_PATH)) {
    const saved = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    auth.setCredentials(saved);
    console.log("✓ Using saved OAuth token.");
    return;
  }

  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  console.log("\nOpening browser for Google sign-in…");
  openBrowser(authUrl);

  const code = await waitForCode();
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("✓ Authorised and token saved.");
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin"  ? `open "${url}"` :
    process.platform === "win32"   ? `start "${url}"` :
                                     `xdg-open "${url}"`;
  exec(cmd);
}

function waitForCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      if (code) {
        res.end("<h2>✅ Authorised! You can close this tab and return to your terminal.</h2>");
        server.close();
        resolve(code);
      } else {
        res.end("No code found.");
        reject(new Error("No code in callback"));
      }
    });
    server.listen(REDIRECT_PORT, () =>
      console.log(`Waiting for Google callback on http://localhost:${REDIRECT_PORT} …`)
    );
    server.on("error", reject);
  });
}

// ── Sheet writer ─────────────────────────────────────────────────────────────
async function write(sheets, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function clear(sheets, range) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range,
  });
}

// ── Data ─────────────────────────────────────────────────────────────────────
const PLAYERS = [
  // playerName,           yr,   birthCity,       countries,  clubs,                                          caps, photoUrl
  ["Hossam Hassan",        1966, "Kafr El Sheikh", "Egypt",    "Al Ahly, Zamalek",                             184,  ""],
  ["Ahmed Hassan",         1975, "Kafr El Sheikh", "Egypt",    "Zamalek, Beşiktaş, Al Ahly",                   184,  ""],
  ["Essam El-Hadary",      1973, "Damietta",       "Egypt",    "Al Ahly, Sion, Al-Taawoun",                    169,  ""],
  ["Ahmed Fathy",          1984, "Port Said",      "Egypt",    "Al Masry, Hull City, Al Ahly",                 105,  ""],
  ["Mohamed Aboutrika",    1978, "Cairo",           "Egypt",    "Al Ahly",                                      101,  ""],
  ["Mohamed Salah",        1992, "Nagrig",          "Egypt",    "El Mokawloon, Chelsea, Roma, Liverpool",       103,  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg"],
  ["Wael Gomaa",           1981, "Cairo",           "Egypt",    "Al Ahly",                                       69,  ""],
  ["Hossam Ghaly",         1981, "Mansoura",        "Egypt",    "Al Ahly, Tottenham Hotspur, Feyenoord",         60,  ""],
  ["Amr Zaki",             1983, "Damietta",        "Egypt",    "Zamalek, Wigan Athletic, Hull City",             56,  ""],
];

const MATCHES = [
  // date,         opponent,        eg, opp, competition,            venue,                          city,           isHome
  ["1920-08-28", "Italy",           1,  4,  "Olympics 1920",        "Stade Olympique d'Anvers",     "Antwerp",      "false"],
  ["1934-05-27", "Hungary",         2,  4,  "FIFA World Cup 1934",  "Stadio Nazionale del PNF",     "Rome",         "false"],
  ["1957-02-16", "Ethiopia",        4,  0,  "AFCON 1957 Final",     "Municipal Stadium",            "Khartoum",     "false"],
  ["1986-03-13", "Cameroon",        0,  0,  "AFCON 1986 Final",     "Cairo International Stadium",  "Cairo",        "true"],
  ["1998-02-28", "South Africa",    2,  0,  "AFCON 1998 Final",     "Ouagadougou Stadium",          "Ouagadougou",  "false"],
  ["2006-02-10", "Ivory Coast",     0,  0,  "AFCON 2006 Final",     "Cairo International Stadium",  "Cairo",        "true"],
  ["2008-02-10", "Cameroon",        1,  0,  "AFCON 2008 Final",     "Estadio Nacional de Ghana",    "Accra",        "false"],
  ["2010-01-31", "Ghana",           1,  0,  "AFCON 2010 Final",     "Estadio de Bata",              "Bata",         "false"],
  ["2018-06-15", "Uruguay",         0,  1,  "FIFA World Cup 2018",  "Ekaterinburg Arena",           "Yekaterinburg","false"],
  ["2018-06-19", "Russia",          1,  3,  "FIFA World Cup 2018",  "Saint Petersburg Stadium",     "St Petersburg","false"],
  ["2018-06-25", "Saudi Arabia",    2,  2,  "FIFA World Cup 2018",  "Volgograd Arena",              "Volgograd",    "false"],
  ["2022-01-11", "Nigeria",         1,  0,  "AFCON 2021",           "Stade Roumde Adjia",           "Garoua",       "false"],
  ["2022-02-06", "Senegal",         0,  0,  "AFCON 2021 Final",     "Stade d'Olembe",               "Yaoundé",      "false"],
  ["2025-06-20", "Morocco",         1,  2,  "WCQ 2026",             "Cairo International Stadium",  "Cairo",        "true"],
  ["2025-09-09", "Sierra Leone",    3,  0,  "WCQ 2026",             "Cairo International Stadium",  "Cairo",        "true"],
];

const GOALS = [
  // date,         opponent,         playerName,           type,      min
  ["1957-02-16", "Ethiopia",       "Hossam Hassan",      "goal",    12],
  ["1957-02-16", "Ethiopia",       "Hossam Hassan",      "goal",    44],
  ["1998-02-28", "South Africa",   "Hossam Hassan",      "goal",    18],
  ["1998-02-28", "South Africa",   "Hossam Hassan",      "goal",    63],
  ["2008-02-10", "Cameroon",       "Mohamed Aboutrika",  "goal",    77],
  ["2010-01-31", "Ghana",          "Mohamed Aboutrika",  "goal",    85],
  ["2010-01-31", "Ghana",          "Ahmed Hassan",       "assist",  85],
  ["2018-06-19", "Russia",         "Mohamed Salah",      "goal",    73],
  ["2018-06-25", "Saudi Arabia",   "Mohamed Salah",      "goal",    22],
  ["2018-06-25", "Saudi Arabia",   "Amr Zaki",           "goal",    45],
  ["2022-01-11", "Nigeria",        "Mohamed Salah",      "goal",    57],
  ["2025-06-20", "Morocco",        "Mohamed Salah",      "goal",    11],
  ["2025-09-09", "Sierra Leone",   "Mohamed Salah",      "goal",     9],
  ["2025-09-09", "Sierra Leone",   "Mohamed Salah",      "goal",    55],
  ["2025-09-09", "Sierra Leone",   "Amr Zaki",           "goal",    78],
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await getTokens();

  const sheets = google.sheets({ version: "v4", auth });

  // Players — headers already exist; add photoUrl to col G if missing
  console.log("Writing Players…");
  await write(sheets, "Players!G1", [["photoUrl"]]);
  await clear(sheets, "Players!A2:G1000");
  await write(sheets, "Players!A2", PLAYERS);
  console.log(`  ✓ ${PLAYERS.length} players`);

  // Matches — write headers + data
  console.log("Writing Matches…");
  await clear(sheets, "matches!A1:Z1000");
  await write(sheets, "matches!A1", [
    ["date","opponent","egyptGoals","opponentGoals","competition","venue","city","isHome"],
    ...MATCHES,
  ]);
  console.log(`  ✓ ${MATCHES.length} matches`);

  // Goals — write headers + data
  console.log("Writing Goals…");
  await clear(sheets, "goals!A1:Z1000");
  await write(sheets, "goals!A1", [
    ["date","opponent","playerName","type","minute"],
    ...GOALS,
  ]);
  console.log(`  ✓ ${GOALS.length} goal/assist events`);

  console.log("\n✅ All done! Refresh your sheet to verify.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
