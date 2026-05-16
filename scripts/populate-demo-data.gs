/**
 * Egypt Football Database — Demo Data Seeder
 *
 * HOW TO RUN:
 *  1. Open your Google Sheet
 *  2. Extensions → Apps Script
 *  3. Delete any existing code and paste this entire file
 *  4. Click "Run" (play button) → authorize when prompted
 *  5. Done — refresh your sheet to see the data
 */

function populateDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  seedPlayers(ss);
  seedMatches(ss);
  seedGoals(ss);

  SpreadsheetApp.getUi().alert('✅ Demo data added! You can now edit or extend it.');
}

// ─── PLAYERS ────────────────────────────────────────────────────────────────
// Tab already has headers: playerName · playerBirthYear · playerBirthCity · playerCountries · playerClubs · playerCaps
// We also add an optional photoUrl column (col G).

function seedPlayers(ss) {
  const sheet = ss.getSheetByName('Players');

  // Ensure photoUrl header exists in col G
  if (sheet.getRange(1, 7).getValue() === '') {
    sheet.getRange(1, 7).setValue('photoUrl');
  }

  // Clear any existing data rows (keep row 1 headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 7).clearContent();

  const rows = [
    // playerName, playerBirthYear, playerBirthCity, playerCountries, playerClubs, playerCaps, photoUrl
    ['Hossam Hassan',    1966, 'Kafr El Sheikh', 'Egypt', 'Al Ahly, Zamalek',                              184, ''],
    ['Ahmed Hassan',     1975, 'Kafr El Sheikh', 'Egypt', 'Zamalek, Beşiktaş, Al Ahly',                   184, ''],
    ['Essam El-Hadary',  1973, 'Damietta',       'Egypt', 'Al Ahly, Sion, Al-Taawoun',                    169, ''],
    ['Ahmed Fathy',      1984, 'Port Said',      'Egypt', 'Al Masry, Hull City, Al Ahly',                  105, ''],
    ['Mohamed Aboutrika',1978, 'Cairo',           'Egypt', 'Al Ahly',                                      101, ''],
    ['Mohamed Salah',    1992, 'Nagrig',          'Egypt', 'El Mokawloon, Chelsea, Roma, Liverpool',        103, 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg'],
    ['Wael Gomaa',       1981, 'Cairo',           'Egypt', 'Al Ahly',                                       69, ''],
    ['Hossam Ghaly',     1981, 'Mansoura',        'Egypt', 'Al Ahly, Tottenham Hotspur, Feyenoord',         60, ''],
    ['Amr Zaki',         1983, 'Damietta',        'Egypt', 'Zamalek, Wigan Athletic, Hull City',             56, ''],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log('Players: ' + rows.length + ' rows written.');
}

// ─── MATCHES ────────────────────────────────────────────────────────────────
// Adds headers then data.
// Columns: date · opponent · egyptGoals · opponentGoals · competition · venue · city · isHome

function seedMatches(ss) {
  const sheet = ss.getSheetByName('matches');
  sheet.clearContents();

  const headers = [['date', 'opponent', 'egyptGoals', 'opponentGoals', 'competition', 'venue', 'city', 'isHome']];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  const rows = [
    // date,          opponent,       eg, opp, competition,             venue,                           city,           isHome
    ['1920-08-28', 'Italy',         1,   4,   'Olympics 1920',         "Stade Olympique d'Anvers",      'Antwerp',      'false'],
    ['1934-05-27', 'Hungary',       2,   4,   'FIFA World Cup 1934',   'Stadio Nazionale del PNF',      'Rome',         'false'],
    ['1957-02-16', 'Ethiopia',      4,   0,   'AFCON 1957 Final',      'Municipal Stadium',             'Khartoum',     'false'],
    ['1986-03-13', 'Cameroon',      0,   0,   'AFCON 1986 Final',      'Cairo International Stadium',   'Cairo',        'true'],
    ['1998-02-28', 'South Africa',  2,   0,   'AFCON 1998 Final',      'Ouagadougou Stadium',           'Ouagadougou',  'false'],
    ['2006-02-10', 'Ivory Coast',   0,   0,   'AFCON 2006 Final',      'Cairo International Stadium',   'Cairo',        'true'],
    ['2008-02-10', 'Cameroon',      1,   0,   'AFCON 2008 Final',      'Estadio Nacional de Ghana',     'Accra',        'false'],
    ['2010-01-31', 'Ghana',         1,   0,   'AFCON 2010 Final',      'Estadio de Bata',               'Bata',         'false'],
    ['2018-06-15', 'Uruguay',       0,   1,   'FIFA World Cup 2018',   'Ekaterinburg Arena',            'Yekaterinburg','false'],
    ['2018-06-19', 'Russia',        1,   3,   'FIFA World Cup 2018',   'Saint Petersburg Stadium',      'St Petersburg','false'],
    ['2018-06-25', 'Saudi Arabia',  2,   2,   'FIFA World Cup 2018',   'Volgograd Arena',               'Volgograd',    'false'],
    ['2022-01-11', 'Nigeria',       1,   0,   'AFCON 2021',            'Stade Roumde Adjia',            'Garoua',       'false'],
    ['2022-02-06', 'Senegal',       0,   0,   'AFCON 2021 Final',      "Stade d'Olembe",                'Yaoundé',      'false'],
    ['2025-06-20', 'Morocco',       1,   2,   'WCQ 2026',              'Cairo International Stadium',   'Cairo',        'true'],
    ['2025-09-09', 'Sierra Leone',  3,   0,   'WCQ 2026',              'Cairo International Stadium',   'Cairo',        'true'],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log('Matches: ' + rows.length + ' rows written.');
}

// ─── GOALS ──────────────────────────────────────────────────────────────────
// Columns: date · opponent · playerName · type · minute
// date + opponent must match a row in the matches tab exactly.
// type: goal | assist | og

function seedGoals(ss) {
  const sheet = ss.getSheetByName('goals');
  sheet.clearContents();

  const headers = [['date', 'opponent', 'playerName', 'type', 'minute']];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

  const rows = [
    // date,          opponent,        playerName,           type,     minute
    ['1957-02-16', 'Ethiopia',      'Hossam Hassan',      'goal',   12],
    ['1957-02-16', 'Ethiopia',      'Hossam Hassan',      'goal',   44],
    ['1998-02-28', 'South Africa',  'Hossam Hassan',      'goal',   18],
    ['1998-02-28', 'South Africa',  'Hossam Hassan',      'goal',   63],
    ['2008-02-10', 'Cameroon',      'Mohamed Aboutrika',  'goal',   77],
    ['2010-01-31', 'Ghana',         'Mohamed Aboutrika',  'goal',   85],
    ['2010-01-31', 'Ghana',         'Ahmed Hassan',       'assist', 85],
    ['2018-06-19', 'Russia',        'Mohamed Salah',      'goal',   73],
    ['2018-06-25', 'Saudi Arabia',  'Mohamed Salah',      'goal',   22],
    ['2018-06-25', 'Saudi Arabia',  'Amr Zaki',           'goal',   45],
    ['2022-01-11', 'Nigeria',       'Mohamed Salah',      'goal',   57],
    ['2025-06-20', 'Morocco',       'Mohamed Salah',      'goal',   11],
    ['2025-09-09', 'Sierra Leone',  'Mohamed Salah',      'goal',    9],
    ['2025-09-09', 'Sierra Leone',  'Mohamed Salah',      'goal',   55],
    ['2025-09-09', 'Sierra Leone',  'Amr Zaki',           'goal',   78],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log('Goals: ' + rows.length + ' rows written.');
}
