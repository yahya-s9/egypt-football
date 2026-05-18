"""
Scrapes all Egyptian national team players from Transfermarkt (rekordnationalspieler),
filters those with > 10 international appearances, skips players already in the sheet,
fetches their profile (birth year, birth city, photo) from the local API, and writes
new players to the Google Sheet.

Run: cd ~/Desktop/transfermarkt-api && poetry run python ../egypt-football/scripts/fetch-egypt-internationals.py
"""

import json, os, re, time, sys
from pathlib import Path

import requests
from lxml import html
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR  = Path(__file__).parent.parent
TOKEN_PATH = BASE_DIR / "scripts" / "token.json"
ENV_PATH   = BASE_DIR / ".env.local"

env = {}
for line in ENV_PATH.read_text().splitlines():
    if "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip()

SHEET_ID = env["GOOGLE_SHEET_ID"]
API_KEY  = env["GOOGLE_API_KEY"]
TM_API   = env.get("TRANSFERMARKT_API_URL", "https://transfermarkt-api-8622.onrender.com")
MIN_APPS = 10
DELAY    = 0.8

TM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Google Sheets auth (reuse saved token) ────────────────────────────────────
token = json.loads(TOKEN_PATH.read_text())
creds = Credentials(
    token=token.get("access_token"),
    refresh_token=token.get("refresh_token"),
    token_uri="https://oauth2.googleapis.com/token",
    client_id=env["GOOGLE_OAUTH_CLIENT_ID"],
    client_secret=env["GOOGLE_OAUTH_CLIENT_SECRET"],
)
service = build("sheets", "v4", credentials=creds, cache_discovery=False)

# ── Read existing sheet ────────────────────────────────────────────────────────
sheet_data = service.spreadsheets().values().get(
    spreadsheetId=SHEET_ID, range="Players"
).execute()
values  = sheet_data["values"]
headers = values[0]
name_i  = headers.index("playerName")
tm_i    = headers.index("transfermarktUrl")

existing_ids   = set()
existing_names = set()
for row in values[1:]:
    tm = row[tm_i] if len(row) > tm_i else ""
    m  = re.search(r"spieler/(\d+)", tm)
    if m: existing_ids.add(m.group(1))
    n  = row[name_i].strip().lower() if len(row) > name_i else ""
    if n: existing_names.add(n)

print(f"Existing players in sheet: {len(existing_names)}\n")

# ── Scrape Transfermarkt ───────────────────────────────────────────────────────
BASE_URL  = "https://www.transfermarkt.com/agypten/rekordnationalspieler/verein/3672"
all_players = []
page = 1

while True:
    url  = BASE_URL if page == 1 else f"{BASE_URL}/page/{page}"
    resp = requests.get(url, headers=TM_HEADERS, timeout=15)
    tree = html.fromstring(resp.content)
    rows = tree.xpath('//table[contains(@class,"items")]//tr[@class="odd" or @class="even"]')

    if not rows:
        break

    for row in rows:
        link     = row.xpath('.//a[contains(@href,"/spieler/")]/@href')
        if not link: continue
        tm_id    = re.search(r"spieler/(\d+)", link[0])
        if not tm_id: continue
        tm_id    = tm_id.group(1)

        name_els = row.xpath('.//a[contains(@href,"/spieler/")]/text()')
        name     = name_els[0].strip() if name_els else ""
        tds      = row.xpath(".//td")
        td_texts = [td.text_content().strip() for td in tds]

        # TD layout: rank, player_block, img, name, position, age, apps, goals, debut, debut_age
        try:
            apps = int(td_texts[6]) if len(td_texts) > 6 else 0
        except (ValueError, IndexError):
            apps = 0

        try:
            pos_raw = td_texts[4] if len(td_texts) > 4 else ""
        except IndexError:
            pos_raw = ""

        all_players.append({"id": tm_id, "name": name, "apps": apps, "position": pos_raw})

    print(f"  Page {page}: {len(rows)} rows scraped")
    time.sleep(DELAY)

    # Check for next page
    next_links = tree.xpath('//*[contains(@class,"pager")]//a/@href')
    has_next   = any(f"/page/{page + 1}" in lnk for lnk in next_links)
    if not has_next:
        break
    page += 1

print(f"\nTotal scraped: {len(all_players)}")

# ── Filter ─────────────────────────────────────────────────────────────────────
def map_position(pos):
    p = pos.lower()
    if "goalkeeper" in p:                                      return "GK"
    if "back" in p or "defender" in p or "libero" in p:       return "DEF"
    if "winger" in p or "forward" in p or "striker" in p:     return "FW"
    if "midfield" in p:                                        return "MF"
    return ""

candidates = [
    p for p in all_players
    if p["apps"] > MIN_APPS
    and p["id"] not in existing_ids
    and p["name"].lower() not in existing_names
]
print(f"After filter (>{MIN_APPS} apps, not in sheet): {len(candidates)}")

if not candidates:
    print("Nothing new to add.")
    sys.exit(0)

# ── Fetch profiles from local API ─────────────────────────────────────────────
print(f"\nFetching profiles for {len(candidates)} players…")

def build_tm_url(name, pid):
    slug = re.sub(r"[^a-z0-9\s]", "", name.lower()).replace(" ", "-")
    return f"https://www.transfermarkt.com/{slug}/profil/spieler/{pid}"

rows_to_add = []
for i, p in enumerate(candidates):
    try:
        r    = requests.get(f"{TM_API}/players/{p['id']}/profile", timeout=15)
        prof = r.json() if r.ok else {}
    except Exception:
        prof = {}

    time.sleep(DELAY)

    birth_year = ""
    if prof.get("dateOfBirth"):
        birth_year = prof["dateOfBirth"][:4]
    elif prof.get("age"):
        birth_year = str(2026 - int(prof["age"]))

    birth_city = prof.get("placeOfBirth", {}).get("city", "")
    image_url  = prof.get("imageUrl", "")
    full_name  = (prof.get("nameInHomeCountry", "") or "").split(",")[0].strip()
    position   = map_position(prof.get("position", {}).get("main", "") or p["position"])
    tm_url     = build_tm_url(p["name"], p["id"])

    # columns: playerName, playerFullName, position, playerBirthYear, playerBirthCity,
    #          playerCountries, playerClubs, playerCaps, playerGoals, photoUrl,
    #          transfermarktUrl, nickname
    rows_to_add.append([
        p["name"], full_name, position, birth_year, birth_city,
        "Egypt", "", str(p["apps"]), "", image_url, tm_url, ""
    ])

    if i % 10 == 0 or i == len(candidates) - 1:
        print(f"  [{i+1}/{len(candidates)}] {p['name']} ({p['apps']} apps)")

# ── Write to sheet ─────────────────────────────────────────────────────────────
print(f"\nWriting {len(rows_to_add)} rows to sheet…")
service.spreadsheets().values().append(
    spreadsheetId=SHEET_ID,
    range="Players!A:L",
    valueInputOption="USER_ENTERED",
    body={"values": rows_to_add},
).execute()

print(f"\n✅ Added {len(rows_to_add)} Egyptian internationals to the sheet.")
