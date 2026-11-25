/**
 * A small gazetteer for placing news-reported cyber incidents on a globe.
 * `name` matches the `properties.name` of world-atlas countries-110m so the
 * globe can shade the polygon; lat/lng is a representative point (capital or
 * centroid) used when the polygon is too small to see. `terms` are matched as
 * whole words, case-sensitively: the country, its demonym, and unambiguous
 * places, institutions and well-known organisations (placed at their home
 * country) that headlines name instead of the country. Security vendors are
 * deliberately absent — their reports are not incidents.
 */
export interface Place {
  name: string;
  iso2: string;
  lat: number;
  lng: number;
  terms: string[];
}

export const PLACES: Place[] = [
  { name: "United States of America", iso2: "US", lat: 39.5, lng: -98.4, terms: ["United States", "U.S.", "US", "USA", "America", "American", "Americans", "CIA", "ODNI", "FBI", "NSA", "CISA", "Pentagon", "White House", "Washington", "New York", "California", "Texas", "Florida", "Chicago", "O'Hare", "Los Angeles", "San Francisco", "Seattle", "Boston", "Atlanta", "Ohio", "Michigan", "Pennsylvania", "Virginia", "Minnesota", "Colorado", "Arizona", "Nevada", "Oregon", "Illinois", "New Jersey", "Massachusetts", "El Cajon", "San Diego", "Medicare", "Medicaid", "FAA", "Nvidia", "Microsoft", "Google", "Amazon", "Apple", "Meta", "Oracle", "Salesforce", "Cisco", "AT&T", "Verizon", "T-Mobile", "UnitedHealth", "Change Healthcare", "Kaiser Permanente", "Ticketmaster", "Coinbase", "GoFundMe", "Expedia", "Chase", "JPMorgan", "Bank of America", "Wells Fargo", "Citigroup", "Walmart", "Target Corp", "Home Depot", "MGM Resorts", "Caesars", "Snowflake", "Okta", "Ascension", "CDK Global", "PowerSchool", "Conduent", "Comcast", "Xfinity", "Allianz Life", "Aflac", "Episource", "Columbia University", "Harvard", "USDA", "Algonquin", "DOGE"] },
  { name: "Canada", iso2: "CA", lat: 56.1, lng: -106.3, terms: ["Canada", "Canadian", "Ontario", "Quebec", "Toronto", "Vancouver", "Alberta", "British Columbia", "Rogers", "Bell Canada", "Nova Scotia Power", "WestJet"] },
  { name: "Mexico", iso2: "MX", lat: 23.6, lng: -102.5, terms: ["Mexico", "Mexican"] },
  { name: "Brazil", iso2: "BR", lat: -14.2, lng: -51.9, terms: ["Brazil", "Brazilian", "São Paulo", "Sao Paulo", "Petrobras"] },
  { name: "Argentina", iso2: "AR", lat: -38.4, lng: -63.6, terms: ["Argentina", "Argentine", "Argentinian"] },
  { name: "Chile", iso2: "CL", lat: -35.7, lng: -71.5, terms: ["Chile", "Chilean"] },
  { name: "Colombia", iso2: "CO", lat: 4.6, lng: -74.3, terms: ["Colombia", "Colombian"] },
  { name: "Peru", iso2: "PE", lat: -9.2, lng: -75.0, terms: ["Peru", "Peruvian"] },
  { name: "Venezuela", iso2: "VE", lat: 6.4, lng: -66.6, terms: ["Venezuela", "Venezuelan"] },
  { name: "Ecuador", iso2: "EC", lat: -1.8, lng: -78.2, terms: ["Ecuador", "Ecuadorian"] },
  { name: "United Kingdom", iso2: "GB", lat: 54.0, lng: -2.5, terms: ["United Kingdom", "UK", "U.K.", "Britain", "British", "England", "English", "Scotland", "Scottish", "Wales", "Welsh", "Northern Ireland", "London", "Manchester", "NHS", "Gatwick", "Heathrow", "Jaguar Land Rover", "JLR", "Marks & Spencer", "M&S", "Co-op", "Harrods", "Ofcom", "NCSC", "BT Group", "Vodafone", "BBC", "Tesco", "Sainsbury's", "Kido", "Transport for London", "TfL", "Royal Mail", "Capita", "Synnovis"] },
  { name: "Ireland", iso2: "IE", lat: 53.4, lng: -8.2, terms: ["Ireland", "Irish", "Dublin", "HSE"] },
  { name: "France", iso2: "FR", lat: 46.2, lng: 2.2, terms: ["France", "French", "Paris", "Guadeloupe", "Martinique", "Réunion", "French Guiana", "Orange SA", "Renault", "Air France", "Bouygues"] },
  { name: "Germany", iso2: "DE", lat: 51.2, lng: 10.4, terms: ["Germany", "German", "Berlin", "Munich", "Bundestag", "Siemens", "SAP", "Volkswagen", "Lufthansa", "Deutsche Bahn", "Deutsche Telekom", "Cleverbridge"] },
  { name: "Netherlands", iso2: "NL", lat: 52.1, lng: 5.3, terms: ["Netherlands", "Dutch", "Amsterdam", "Holland", "ASML", "Philips", "Heineken"] },
  { name: "Belgium", iso2: "BE", lat: 50.5, lng: 4.5, terms: ["Belgium", "Belgian", "Brussels", "EU Commission", "European Commission", "European Parliament", "European Union", "EU", "NATO"] },
  { name: "Luxembourg", iso2: "LU", lat: 49.8, lng: 6.1, terms: ["Luxembourg"] },
  { name: "Switzerland", iso2: "CH", lat: 46.8, lng: 8.2, terms: ["Switzerland", "Swiss", "Zurich", "Geneva", "Nestlé", "UBS"] },
  { name: "Austria", iso2: "AT", lat: 47.5, lng: 14.6, terms: ["Austria", "Austrian", "Vienna"] },
  { name: "Italy", iso2: "IT", lat: 41.9, lng: 12.6, terms: ["Italy", "Italian", "Rome", "Milan"] },
  { name: "Spain", iso2: "ES", lat: 40.5, lng: -3.7, terms: ["Spain", "Spanish", "Madrid", "Barcelona", "LaLiga", "Telefónica", "Telefonica", "Iberia", "Santander"] },
  { name: "Portugal", iso2: "PT", lat: 39.4, lng: -8.2, terms: ["Portugal", "Portuguese", "Lisbon"] },
  { name: "Denmark", iso2: "DK", lat: 56.3, lng: 9.5, terms: ["Denmark", "Danish", "Copenhagen", "Maersk", "Novo Nordisk"] },
  { name: "Norway", iso2: "NO", lat: 60.5, lng: 8.5, terms: ["Norway", "Norwegian", "Oslo"] },
  { name: "Sweden", iso2: "SE", lat: 60.1, lng: 18.6, terms: ["Sweden", "Swedish", "Stockholm", "Ericsson", "Volvo", "Miljödata"] },
  { name: "Finland", iso2: "FI", lat: 61.9, lng: 25.7, terms: ["Finland", "Finnish", "Helsinki"] },
  { name: "Iceland", iso2: "IS", lat: 64.9, lng: -19.0, terms: ["Iceland", "Icelandic"] },
  { name: "Poland", iso2: "PL", lat: 51.9, lng: 19.1, terms: ["Poland", "Polish", "Warsaw"] },
  { name: "Czechia", iso2: "CZ", lat: 49.8, lng: 15.5, terms: ["Czech Republic", "Czechia", "Czech", "Prague"] },
  { name: "Slovakia", iso2: "SK", lat: 48.7, lng: 19.7, terms: ["Slovakia", "Slovak"] },
  { name: "Hungary", iso2: "HU", lat: 47.2, lng: 19.5, terms: ["Hungary", "Hungarian", "Budapest"] },
  { name: "Romania", iso2: "RO", lat: 45.9, lng: 25.0, terms: ["Romania", "Romanian", "Bucharest"] },
  { name: "Bulgaria", iso2: "BG", lat: 42.7, lng: 25.5, terms: ["Bulgaria", "Bulgarian"] },
  { name: "Greece", iso2: "GR", lat: 39.1, lng: 21.8, terms: ["Greece", "Greek", "Athens"] },
  { name: "Serbia", iso2: "RS", lat: 44.0, lng: 21.0, terms: ["Serbia", "Serbian"] },
  { name: "Croatia", iso2: "HR", lat: 45.1, lng: 15.2, terms: ["Croatia", "Croatian"] },
  { name: "Slovenia", iso2: "SI", lat: 46.2, lng: 14.9, terms: ["Slovenia", "Slovenian"] },
  { name: "Estonia", iso2: "EE", lat: 58.6, lng: 25.0, terms: ["Estonia", "Estonian", "Tallinn"] },
  { name: "Latvia", iso2: "LV", lat: 56.9, lng: 24.6, terms: ["Latvia", "Latvian", "Riga"] },
  { name: "Lithuania", iso2: "LT", lat: 55.2, lng: 23.9, terms: ["Lithuania", "Lithuanian", "Vilnius"] },
  { name: "Ukraine", iso2: "UA", lat: 48.4, lng: 31.2, terms: ["Ukraine", "Ukrainian", "Ukrainians", "Kyiv", "Kiev"] },
  { name: "Belarus", iso2: "BY", lat: 53.7, lng: 27.9, terms: ["Belarus", "Belarusian"] },
  { name: "Moldova", iso2: "MD", lat: 47.4, lng: 28.4, terms: ["Moldova", "Moldovan"] },
  { name: "Russia", iso2: "RU", lat: 61.5, lng: 99.0, terms: ["Russia", "Russian", "Russians", "Moscow", "Kremlin", "Russia's"] },
  { name: "Turkey", iso2: "TR", lat: 39.0, lng: 35.2, terms: ["Turkey", "Türkiye", "Turkiye", "Turkish", "Istanbul", "Ankara"] },
  { name: "Georgia", iso2: "GE", lat: 42.3, lng: 43.4, terms: ["Tbilisi"] },
  { name: "Armenia", iso2: "AM", lat: 40.1, lng: 45.0, terms: ["Armenia", "Armenian"] },
  { name: "Azerbaijan", iso2: "AZ", lat: 40.1, lng: 47.6, terms: ["Azerbaijan", "Azerbaijani"] },
  { name: "Kazakhstan", iso2: "KZ", lat: 48.0, lng: 66.9, terms: ["Kazakhstan", "Kazakh"] },
  { name: "Israel", iso2: "IL", lat: 31.0, lng: 34.9, terms: ["Israel", "Israeli", "Israelis", "Tel Aviv", "Jerusalem"] },
  { name: "Palestine", iso2: "PS", lat: 31.9, lng: 35.2, terms: ["Palestine", "Palestinian", "Gaza", "West Bank"] },
  { name: "Lebanon", iso2: "LB", lat: 33.9, lng: 35.9, terms: ["Lebanon", "Lebanese", "Beirut"] },
  { name: "Syria", iso2: "SY", lat: 34.8, lng: 39.0, terms: ["Syria", "Syrian", "Damascus"] },
  { name: "Jordan", iso2: "JO", lat: 30.6, lng: 36.2, terms: ["Jordan", "Jordanian", "Amman"] },
  { name: "Iraq", iso2: "IQ", lat: 33.2, lng: 43.7, terms: ["Iraq", "Iraqi", "Baghdad"] },
  { name: "Iran", iso2: "IR", lat: 32.4, lng: 53.7, terms: ["Iran", "Iranian", "Iranians", "Tehran", "IRGC"] },
  { name: "Saudi Arabia", iso2: "SA", lat: 23.9, lng: 45.1, terms: ["Saudi Arabia", "Saudi", "Riyadh", "Aramco"] },
  { name: "United Arab Emirates", iso2: "AE", lat: 23.4, lng: 53.8, terms: ["United Arab Emirates", "UAE", "Emirati", "Dubai", "Abu Dhabi"] },
  { name: "Qatar", iso2: "QA", lat: 25.4, lng: 51.2, terms: ["Qatar", "Qatari", "Doha"] },
  { name: "Kuwait", iso2: "KW", lat: 29.3, lng: 47.5, terms: ["Kuwait", "Kuwaiti"] },
  { name: "Oman", iso2: "OM", lat: 21.5, lng: 55.9, terms: ["Oman", "Omani"] },
  { name: "Yemen", iso2: "YE", lat: 15.6, lng: 48.5, terms: ["Yemen", "Yemeni", "Houthi", "Houthis"] },
  { name: "Egypt", iso2: "EG", lat: 26.8, lng: 30.8, terms: ["Egypt", "Egyptian", "Cairo"] },
  { name: "Morocco", iso2: "MA", lat: 31.8, lng: -7.1, terms: ["Morocco", "Moroccan"] },
  { name: "Algeria", iso2: "DZ", lat: 28.0, lng: 1.7, terms: ["Algeria", "Algerian"] },
  { name: "Tunisia", iso2: "TN", lat: 33.9, lng: 9.5, terms: ["Tunisia", "Tunisian"] },
  { name: "Libya", iso2: "LY", lat: 26.3, lng: 17.2, terms: ["Libya", "Libyan"] },
  { name: "Nigeria", iso2: "NG", lat: 9.1, lng: 8.7, terms: ["Nigeria", "Nigerian", "Lagos", "Abuja"] },
  { name: "Ghana", iso2: "GH", lat: 7.9, lng: -1.0, terms: ["Ghana", "Ghanaian", "Accra"] },
  { name: "Senegal", iso2: "SN", lat: 14.5, lng: -14.5, terms: ["Senegal", "Senegalese"] },
  { name: "Côte d'Ivoire", iso2: "CI", lat: 7.5, lng: -5.5, terms: ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire", "Ivorian"] },
  { name: "Kenya", iso2: "KE", lat: -0.0, lng: 37.9, terms: ["Kenya", "Kenyan", "Nairobi"] },
  { name: "Ethiopia", iso2: "ET", lat: 9.1, lng: 40.5, terms: ["Ethiopia", "Ethiopian"] },
  { name: "Uganda", iso2: "UG", lat: 1.4, lng: 32.3, terms: ["Uganda", "Ugandan", "Kampala"] },
  { name: "Tanzania", iso2: "TZ", lat: -6.4, lng: 34.9, terms: ["Tanzania", "Tanzanian"] },
  { name: "Rwanda", iso2: "RW", lat: -1.9, lng: 29.9, terms: ["Rwanda", "Rwandan", "Kigali"] },
  { name: "South Africa", iso2: "ZA", lat: -30.6, lng: 22.9, terms: ["South Africa", "South African", "Johannesburg", "Cape Town", "Pretoria"] },
  { name: "Zambia", iso2: "ZM", lat: -13.1, lng: 27.8, terms: ["Zambia", "Zambian"] },
  { name: "Zimbabwe", iso2: "ZW", lat: -19.0, lng: 29.2, terms: ["Zimbabwe", "Zimbabwean"] },
  { name: "Angola", iso2: "AO", lat: -11.2, lng: 17.9, terms: ["Angola", "Angolan"] },
  { name: "India", iso2: "IN", lat: 20.6, lng: 79.0, terms: ["India", "Indian", "Indians", "Delhi", "New Delhi", "Mumbai", "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "AIIMS", "NBFC", "Tata Consultancy", "Infosys", "Star Health", "Air India"] },
  { name: "Pakistan", iso2: "PK", lat: 30.4, lng: 69.3, terms: ["Pakistan", "Pakistani", "Islamabad", "Karachi"] },
  { name: "Bangladesh", iso2: "BD", lat: 23.7, lng: 90.4, terms: ["Bangladesh", "Bangladeshi", "Dhaka"] },
  { name: "Sri Lanka", iso2: "LK", lat: 7.9, lng: 80.8, terms: ["Sri Lanka", "Sri Lankan"] },
  { name: "Nepal", iso2: "NP", lat: 28.4, lng: 84.1, terms: ["Nepal", "Nepalese", "Nepali"] },
  { name: "Afghanistan", iso2: "AF", lat: 33.9, lng: 67.7, terms: ["Afghanistan", "Afghan"] },
  { name: "China", iso2: "CN", lat: 35.9, lng: 104.2, terms: ["China", "Chinese", "Beijing", "Shanghai", "PRC", "China's", "Huawei", "Alibaba", "Tencent", "ByteDance", "TikTok"] },
  { name: "Taiwan", iso2: "TW", lat: 23.7, lng: 121.0, terms: ["Taiwan", "Taiwanese", "Taipei"] },
  { name: "Hong Kong", iso2: "HK", lat: 22.3, lng: 114.2, terms: ["Hong Kong"] },
  { name: "Japan", iso2: "JP", lat: 36.2, lng: 138.3, terms: ["Japan", "Japanese", "Tokyo", "Osaka", "Asahi", "Toyota", "Sony", "NTT", "Askul", "Nikkei", "Japan Airlines", "JAL"] },
  { name: "South Korea", iso2: "KR", lat: 35.9, lng: 127.8, terms: ["South Korea", "South Korean", "Seoul", "SK Telecom", "Coupang", "Samsung", "LG Uplus", "Lotte Card", "Kakao"] },
  { name: "North Korea", iso2: "KP", lat: 40.3, lng: 127.5, terms: ["North Korea", "North Korean", "North Koreans", "DPRK", "Pyongyang"] },
  { name: "Mongolia", iso2: "MN", lat: 46.9, lng: 103.8, terms: ["Mongolia", "Mongolian"] },
  { name: "Vietnam", iso2: "VN", lat: 14.1, lng: 108.3, terms: ["Vietnam", "Vietnamese", "Hanoi"] },
  { name: "Thailand", iso2: "TH", lat: 15.9, lng: 100.9, terms: ["Thailand", "Thai", "Bangkok"] },
  { name: "Cambodia", iso2: "KH", lat: 12.6, lng: 105.0, terms: ["Cambodia", "Cambodian"] },
  { name: "Myanmar", iso2: "MM", lat: 21.9, lng: 95.9, terms: ["Myanmar", "Burma", "Burmese"] },
  { name: "Laos", iso2: "LA", lat: 19.9, lng: 102.5, terms: ["Laos", "Lao"] },
  { name: "Malaysia", iso2: "MY", lat: 4.2, lng: 102.0, terms: ["Malaysia", "Malaysian", "Kuala Lumpur"] },
  { name: "Singapore", iso2: "SG", lat: 1.35, lng: 103.8, terms: ["Singapore", "Singaporean", "Singtel"] },
  { name: "Indonesia", iso2: "ID", lat: -0.8, lng: 113.9, terms: ["Indonesia", "Indonesian", "Jakarta"] },
  { name: "Philippines", iso2: "PH", lat: 12.9, lng: 121.8, terms: ["Philippines", "Philippine", "Filipino", "Manila"] },
  { name: "Australia", iso2: "AU", lat: -25.3, lng: 133.8, terms: ["Australia", "Australian", "Australians", "Sydney", "Melbourne", "Canberra", "Qantas", "Medibank", "Optus", "Telstra"] },
  { name: "New Zealand", iso2: "NZ", lat: -40.9, lng: 174.9, terms: ["New Zealand"] },
];

export const PLACE_BY_ISO: Record<string, Place> = Object.fromEntries(PLACES.map((p) => [p.iso2, p]));

/** GDELT reports the outlet's country by English name. */
export function placeByCountryName(n: string): Place | undefined {
  const k = n.trim().toLowerCase();
  if (!k) return undefined;
  return PLACES.find((p) => p.name.toLowerCase() === k || p.terms.some((t) => t.toLowerCase() === k));
}
