import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';


const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GID = process.env.GOOGLE_SHEET_GID;
const OUT_FILE = './src/data/country_data.json';

const FIELD_MAP = {
  "Country ↓ / Artifact →": "country",
  "CARSO status": "carso_status",
  "ONF status": "onf_status",
  "Country Profile Status": "profile_status",
  "Access Rank": "access_rank",
  "Total Access Points": "access_points_total",
  "Overall Access Restriction Description": "access_desc",
  "Total Block 1 Access Points": "access_total",
  "Block 1 Access Restriction Description": "access_restriction_desc",
  "Total Block 2 Other Limiting Points": "block2_total",
  "Other Factors description": "block2_desc",
  "Needs Rank": "needs_rank",
  "Needs #": "needs_count",
  "Needs Range": "needs_range",
  "Needs Range descriptor": "needs_range_desc",
  "Import Icon descriptor": "icon_import",
  "Print Icon descriptor": "icon_print",
  "Store Icon descriptor": "icon_store",
  "Own Icon descriptor": "icon_own",
  "Distribute Icon descriptor": "icon_distribute",
  "Internet Safe Icon descriptor": "icon_internet_safe",
  "Poverty Icon": "icon_poverty",
  "Internet Access Icon": "icon_internet",
  "Logistics Icon": "icon_logistics",
  "Electricity Icon": "icon_electricity",
  "Literacy Icon": "icon_literacy",
  "Ownership Range": "ownership_range",
  "Ownership Descriptor": "ownership_desc",
  "Armed Conflict Descriptor": "conflict_desc",
  "Main Religion": "religion_main",
  "Country Population": "pop_total",
  "Christian Population": "pop_christian",
  "% Christian": "pct_christian",
  "WWL 2025 Rank": "wwl_2025_rank",
  "Persecution Table Readiness": "persecution_ready",
  "Islamic Oppression Icon": "icon_islamic_opp",
  "Religious Nationalism Icon": "icon_religious_nat",
  "Ethno Religious  Hostility Icon": "icon_ethno_hostility",
  "Clan Oppression Icon": "icon_clan_opp",
  "Chr. Denom. Oppression Icon": "icon_denom_opp",
  "Communist Oppression Icon": "icon_comm_opp",
  "Secular Intolerance Icon": "icon_secular_intol",
  "Dictatorial Paranoia Icon": "icon_dict_paranoia",
  "Organized Crime Corruption Icon": "icon_crime_corr",
  "Bible Format Prio #1": "bible_prio1",
  "Bible Format Prio #2": "bible_prio2",
  "Total Languages": "lang_total",
  "Languages with Full Bible": "lang_full_bible",
  "Languages with NT": "lang_nt",
  "Languages w/ Book -Portion": "lang_portion",
  "Languages w/ No Translation": "lang_none",
  "Annual Church Growth": "church_growth",
  "BWL surveys received": "bwl_surveys",
  "BWL 2025 included  (Y/N)": "bwl_2025_included",
  "BWL ONF 2025 Cluster": "bwl_onf_2025_cluster",
  "SME status Country Profile": "sme_status",
  "Final Country Profile Text": "profile_text",
  "Region": "region"
};

const NAME_MAP = {
  "Afghanistan": "AF",
  "Algeria": "DZ",
  "Armenia": "AM",
  "Azerbaijan": "AZ",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Benin": "BJ",
  "Bhutan": "BT",
  "Brazil": "BR",
  "Brunei": "BN",
  "Burkina Faso": "BF",
  "Burundi": "BI",
  "Cambodia": "KH",
  "Cameroon": "CM",
  "Central African Republic": "CF",
  "Chad": "TD",
  "China": "CN",
  "Colombia": "CO",
  "Comoros": "KM",
  "Congo DR": "CD",
  "Cuba": "CU",
  "Djibouti": "DJ",
  "Ecuador": "EC",
  "Egypt": "EG",
  "El Salvador": "SV",
  "Eritrea": "ER",
  "Ethiopia": "ET",
  "Ghana": "GH",
  "Guatemala": "GT",
  "Guinea": "GN",
  "Haiti": "HT",
  "Honduras": "HN",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ivory Coast": "CI",
  "Jordan": "JO",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kuwait": "KW",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Lebanon": "LB",
  "Libya": "LY",
  "Madagascar": "MG",
  "Malawi": "MW",
  "Malaysia": "MY",
  "Maldives": "MV",
  "Mali": "ML",
  "Mauritania": "MR",
  "Mexico": "MX",
  "Morocco": "MA",
  "Mozambique": "MZ",
  "Myanmar": "MM",
  "Namibia": "NA",
  "Nepal": "NP",
  "Nicaragua": "NI",
  "Niger": "NE",
  "Nigeria": "NG",
  "North Korea": "KP",
  "Oman": "OM",
  "Pakistan": "PK",
  "Palestine": "PS",
  "Philippines": "PH",
  "Qatar": "QA",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saudi Arabia": "SA",
  "Somalia": "SO",
  "South Sudan": "SS",
  "Sri Lanka": "LK",
  "Sudan": "SD",
  "Syria": "SY",
  "Tajikistan": "TJ",
  "Tanzania": "TZ",
  "Togo": "TG",
  "Tunisia": "TN",
  "Türkiye": "TR",
  "Turkmenistan": "TM",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "Uzbekistan": "UZ",
  "Venezuela": "VE",
  "Viet nam": "VN",
  "Yemen": "YE",
  "Zimbabwe": "ZW"
}

const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const csvText = await fetch(CSV_URL).then(res => {
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  return res.text();
});

const rows = parse(csvText, { columns: true, skip_empty_lines: true });
const BIBLE_SHORTAGE_FIELDS = [
    'needs_rank', 'needs_count', 'needs_range', 'needs_range_desc',
    'icon_import', 'icon_print', 'icon_store', 'icon_own', 'icon_distribute',
    'icon_internet_safe', 'icon_poverty', 'icon_internet', 'icon_logistics',
    'icon_electricity', 'icon_literacy', 'ownership_range', 'ownership_desc'
];

const FIELDS_TO_REMOVE = [
  'sme_status',
  'carso_status',
  'onf_status',
  'bwl_surveys',
  'bwl_2025_included',
  'profile_status'
];

const remapped = rows
  .filter(row => row['CARSO status']?.trim() !== 'Exclude')
  .reduce((acc, row) => {
    const mapped = {};

    for (const [originalKey, shortKey] of Object.entries(FIELD_MAP)) {
      if (row.hasOwnProperty(originalKey)) {
        let value = row[originalKey];
        if (typeof value === 'string') {
          value = value.trim();
          if (['n/a', '0', 'No Icon', 'not scored'].includes(value)) {
            value = 0;
          }
        }
        mapped[shortKey] = value;
      }
    }

    const countryName = row["Country ↓ / Artifact →"]?.trim();
    const countryCode = NAME_MAP[countryName];

    if (!countryCode) {
      console.warn(`Warning: No country_id found for "${countryName}"`);
      return acc; // Skip entry with no ISO code
    }

    // Remove excluded fields
    for (const field of FIELDS_TO_REMOVE) {
      delete mapped[field];
    }

    if (mapped.onf_status === 'Cluster 5') {
      for (const key of BIBLE_SHORTAGE_FIELDS) {
        delete mapped[key];
      }
    }

    acc[countryCode] = mapped;
    return acc;
  }, {});

    

await fs.writeFile(OUT_FILE, JSON.stringify(remapped, null, 2), 'utf8');
console.log(`Done! Data saved to ${OUT_FILE}`);
