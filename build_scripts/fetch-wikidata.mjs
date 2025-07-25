import fs from 'node:fs/promises';
import 'dotenv/config';

const COUNTRY_DATA_FILE = './src/data/country_data.json';
const BAL_FILE = './src/data/bal.json';

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const ISO_TO_WIKIDATA = {
  "AF": "Q889",    // Afghanistan
  "DZ": "Q262",    // Algeria
  "AM": "Q399",    // Armenia
  "AZ": "Q227",    // Azerbaijan
  "BH": "Q398",    // Bahrain
  "BD": "Q902",    // Bangladesh
  "BJ": "Q962",    // Benin
  "BT": "Q917",    // Bhutan
  "BR": "Q155",    // Brazil
  "BN": "Q921",    // Brunei
  "BF": "Q965",    // Burkina Faso
  "BI": "Q967",    // Burundi
  "KH": "Q424",    // Cambodia
  "CM": "Q1009",   // Cameroon
  "CF": "Q929",    // Central African Republic
  "TD": "Q657",    // Chad
  "CN": "Q148",    // China
  "CO": "Q739",    // Colombia
  "KM": "Q970",    // Comoros
  "CD": "Q974",    // Congo DR
  "CU": "Q241",    // Cuba
  "DJ": "Q977",    // Djibouti
  "EC": "Q736",    // Ecuador
  "EG": "Q79",     // Egypt
  "SV": "Q792",    // El Salvador
  "ER": "Q986",    // Eritrea
  "ET": "Q115",    // Ethiopia
  "GH": "Q117",    // Ghana
  "GT": "Q774",    // Guatemala
  "GN": "Q1006",   // Guinea
  "HT": "Q790",    // Haiti
  "HN": "Q783",    // Honduras
  "IN": "Q668",    // India
  "ID": "Q252",    // Indonesia
  "IR": "Q794",    // Iran
  "IQ": "Q796",    // Iraq
  "CI": "Q1008",   // Ivory Coast
  "JO": "Q810",    // Jordan
  "KZ": "Q232",    // Kazakhstan
  "KE": "Q114",    // Kenya
  "KW": "Q817",    // Kuwait
  "KG": "Q813",    // Kyrgyzstan
  "LA": "Q819",    // Laos
  "LB": "Q822",    // Lebanon
  "LY": "Q1016",   // Libya
  "MG": "Q1019",   // Madagascar
  "MW": "Q1020",   // Malawi
  "MY": "Q833",    // Malaysia
  "MV": "Q826",    // Maldives
  "ML": "Q912",    // Mali
  "MR": "Q1025",   // Mauritania
  "MX": "Q96",     // Mexico
  "MA": "Q1028",   // Morocco
  "MZ": "Q1029",   // Mozambique
  "MM": "Q836",    // Myanmar
  "NA": "Q1030",   // Namibia
  "NP": "Q837",    // Nepal
  "NI": "Q811",    // Nicaragua
  "NE": "Q1032",   // Niger
  "NG": "Q1033",   // Nigeria
  "KP": "Q423",    // North Korea
  "OM": "Q842",    // Oman
  "PK": "Q843",    // Pakistan
  "PS": "Q219060", // Palestine
  "PH": "Q928",    // Philippines
  "QA": "Q846",    // Qatar
  "RU": "Q159",    // Russia
  "RW": "Q1037",   // Rwanda
  "SA": "Q851",    // Saudi Arabia
  "SO": "Q1045",   // Somalia
  "SS": "Q958",    // South Sudan
  "LK": "Q854",    // Sri Lanka
  "SD": "Q1049",   // Sudan
  "SY": "Q858",    // Syria
  "TJ": "Q863",    // Tajikistan
  "TZ": "Q924",    // Tanzania
  "TG": "Q945",    // Togo
  "TN": "Q948",    // Tunisia
  "TR": "Q43",     // Turkey
  "TM": "Q874",    // Turkmenistan
  "UG": "Q1036",   // Uganda
  "UA": "Q212",    // Ukraine
  "AE": "Q878",    // United Arab Emirates
  "UZ": "Q265",    // Uzbekistan
  "VE": "Q717",    // Venezuela
  "VN": "Q881",    // Vietnam
  "YE": "Q805",    // Yemen
  "ZW": "Q954"     // Zimbabwe
};

async function fetchWikidataInfo(countryIds) {
  const query = `
    SELECT ?country ?countryLabel ?capital ?capitalLabel ?area ?gdp ?gdpPerCapita ?hdi 
           ?officialLanguage ?officialLanguageLabel ?flag ?coatOfArms
    WHERE {
      VALUES ?country { ${countryIds.map(id => `wd:${id}`).join(' ')} }
      
      OPTIONAL { ?country wdt:P36 ?capital. }
      OPTIONAL { ?country wdt:P2046 ?area. }
      OPTIONAL { ?country wdt:P2131 ?gdp. }
      OPTIONAL { ?country wdt:P2132 ?gdpPerCapita. }
      OPTIONAL { ?country wdt:P1081 ?hdi. }
      OPTIONAL { ?country wdt:P37 ?officialLanguage. }
      OPTIONAL { ?country wdt:P41 ?flag. }
      OPTIONAL { ?country wdt:P94 ?coatOfArms. }
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;

  const response = await fetch(WIKIDATA_SPARQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'BAL-Data-Fetcher/1.0'
    },
    body: new URLSearchParams({ query })
  });

  if (!response.ok) {
    throw new Error(`Wikidata API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results.bindings;
}

function processWikidataResults(results) {
  const processed = {};
  
  results.forEach(binding => {
    const countryId = binding.country.value.split('/').pop();
    
    if (!processed[countryId]) {
      processed[countryId] = {
        wikidata_id: countryId,
        capital: binding.capitalLabel?.value || null,
        area_km2: binding.area ? parseFloat(binding.area.value) : null,
        gdp_nominal: binding.gdp ? parseFloat(binding.gdp.value) : null,
        gdp_per_capita: binding.gdpPerCapita ? parseFloat(binding.gdpPerCapita.value) : null,
        hdi: binding.hdi ? parseFloat(binding.hdi.value) : null,
        official_languages: [],
        flag_image: binding.flag?.value || null,
        coat_of_arms: binding.coatOfArms?.value || null
      };
    }
    
    if (binding.officialLanguageLabel?.value && 
        !processed[countryId].official_languages.includes(binding.officialLanguageLabel.value)) {
      processed[countryId].official_languages.push(binding.officialLanguageLabel.value);
    }
  });
  
  return processed;
}

async function main() {
  try {
    console.log('Reading existing country data...');
    const countryData = JSON.parse(await fs.readFile(COUNTRY_DATA_FILE, 'utf8'));
    
    console.log('Fetching data from Wikidata...');
    const wikidataIds = Object.values(ISO_TO_WIKIDATA);
    const wikidataResults = await fetchWikidataInfo(wikidataIds);
    const processedWikidata = processWikidataResults(wikidataResults);
    
    console.log('Merging data...');
    const balData = {};
    
    for (const [isoCode, data] of Object.entries(countryData)) {
      const wikidataId = ISO_TO_WIKIDATA[isoCode];
      const wikidataInfo = wikidataId ? processedWikidata[wikidataId] : {};
      
      balData[isoCode] = {
        ...data,
        ...wikidataInfo
      };
    }
    
    console.log('Writing merged data to bal.json...');
    await fs.writeFile(BAL_FILE, JSON.stringify(balData, null, 2), 'utf8');
    console.log(`Done! Merged data saved to ${BAL_FILE}`);
    
  } catch (error) {
    console.error('Error fetching Wikidata:', error);
    process.exit(1);
  }
}

main();