/**
 * Threat groups that headlines name, with the origin most often *reported*
 * in public threat-intel and government advisories. This is press-level
 * attribution for orientation, not a verdict — the UI labels it as reported.
 * `origin` is an ISO-2 code, or undefined where reporting is mixed/unknown.
 */
export type ActorKind = "state" | "criminal" | "hacktivist";

export interface Actor {
  name: string;
  kind: ActorKind;
  origin?: string;
  aliases: string[];
}

export const ACTORS: Actor[] = [
  // Russia — state
  { name: "APT28 / Fancy Bear", kind: "state", origin: "RU", aliases: ["APT28", "Fancy Bear", "Forest Blizzard"] },
  { name: "APT29 / Cozy Bear", kind: "state", origin: "RU", aliases: ["APT29", "Cozy Bear", "Midnight Blizzard", "Nobelium"] },
  { name: "Sandworm", kind: "state", origin: "RU", aliases: ["Sandworm", "Seashell Blizzard", "APT44"] },
  { name: "Turla", kind: "state", origin: "RU", aliases: ["Turla", "Secret Blizzard"] },
  { name: "Gamaredon", kind: "state", origin: "RU", aliases: ["Gamaredon"] },
  { name: "Star Blizzard", kind: "state", origin: "RU", aliases: ["Star Blizzard", "Cold River", "ColdRiver"] },
  // Russia — hacktivist
  { name: "NoName057(16)", kind: "hacktivist", origin: "RU", aliases: ["NoName057", "NoName057(16)", "NoName"] },
  { name: "Killnet", kind: "hacktivist", origin: "RU", aliases: ["Killnet"] },
  { name: "Cyber Army of Russia", kind: "hacktivist", origin: "RU", aliases: ["Cyber Army of Russia"] },
  // Russia-linked — criminal
  { name: "LockBit", kind: "criminal", origin: "RU", aliases: ["LockBit"] },
  { name: "Cl0p", kind: "criminal", origin: "RU", aliases: ["Cl0p", "Clop"] },
  { name: "Black Basta", kind: "criminal", origin: "RU", aliases: ["Black Basta"] },
  { name: "Conti", kind: "criminal", origin: "RU", aliases: ["Conti"] },
  { name: "REvil", kind: "criminal", origin: "RU", aliases: ["REvil", "Sodinokibi"] },
  { name: "Evil Corp", kind: "criminal", origin: "RU", aliases: ["Evil Corp"] },
  { name: "Qilin", kind: "criminal", origin: "RU", aliases: ["Qilin", "Agenda ransomware"] },
  // China — state
  { name: "Volt Typhoon", kind: "state", origin: "CN", aliases: ["Volt Typhoon"] },
  { name: "Salt Typhoon", kind: "state", origin: "CN", aliases: ["Salt Typhoon"] },
  { name: "Silk Typhoon", kind: "state", origin: "CN", aliases: ["Silk Typhoon", "Hafnium"] },
  { name: "Flax Typhoon", kind: "state", origin: "CN", aliases: ["Flax Typhoon"] },
  { name: "Linen Typhoon", kind: "state", origin: "CN", aliases: ["Linen Typhoon", "Violet Typhoon", "Storm-2603"] },
  { name: "APT41", kind: "state", origin: "CN", aliases: ["APT41", "Double Dragon", "Brass Typhoon"] },
  { name: "APT40", kind: "state", origin: "CN", aliases: ["APT40"] },
  { name: "APT31", kind: "state", origin: "CN", aliases: ["APT31"] },
  { name: "Mustang Panda", kind: "state", origin: "CN", aliases: ["Mustang Panda"] },
  // North Korea — state
  { name: "Lazarus Group", kind: "state", origin: "KP", aliases: ["Lazarus", "TraderTraitor", "APT38", "Bluenoroff"] },
  { name: "Kimsuky", kind: "state", origin: "KP", aliases: ["Kimsuky", "APT43"] },
  { name: "Andariel", kind: "state", origin: "KP", aliases: ["Andariel", "Onyx Sleet"] },
  { name: "Famous Chollima", kind: "state", origin: "KP", aliases: ["Famous Chollima", "IT workers scheme"] },
  // Iran — state / aligned
  { name: "Charming Kitten", kind: "state", origin: "IR", aliases: ["Charming Kitten", "APT35", "APT42", "Mint Sandstorm"] },
  { name: "APT33", kind: "state", origin: "IR", aliases: ["APT33", "Peach Sandstorm"] },
  { name: "APT34 / OilRig", kind: "state", origin: "IR", aliases: ["APT34", "OilRig"] },
  { name: "MuddyWater", kind: "state", origin: "IR", aliases: ["MuddyWater"] },
  { name: "Pioneer Kitten", kind: "state", origin: "IR", aliases: ["Pioneer Kitten", "Fox Kitten"] },
  { name: "CyberAv3ngers", kind: "hacktivist", origin: "IR", aliases: ["CyberAv3ngers", "Cyber Av3ngers"] },
  { name: "Handala", kind: "hacktivist", origin: "IR", aliases: ["Handala"] },
  // Criminal — origin mixed or not reported
  { name: "Scattered Spider", kind: "criminal", aliases: ["Scattered Spider", "Octo Tempest", "UNC3944"] },
  { name: "ShinyHunters", kind: "criminal", aliases: ["ShinyHunters", "Shiny Hunters"] },
  { name: "Lapsus$", kind: "criminal", aliases: ["Lapsus$", "Lapsus"] },
  { name: "Akira", kind: "criminal", aliases: ["Akira ransomware", "Akira gang", "Akira group"] },
  { name: "Play", kind: "criminal", aliases: ["Play ransomware"] },
  { name: "Medusa", kind: "criminal", aliases: ["Medusa ransomware", "Medusa gang"] },
  { name: "RansomHub", kind: "criminal", aliases: ["RansomHub"] },
  { name: "INC Ransom", kind: "criminal", aliases: ["INC Ransom"] },
  { name: "Rhysida", kind: "criminal", aliases: ["Rhysida"] },
  { name: "DragonForce", kind: "criminal", aliases: ["DragonForce"] },
  { name: "SafePay", kind: "criminal", aliases: ["SafePay"] },
  { name: "Interlock", kind: "criminal", aliases: ["Interlock ransomware", "Interlock gang"] },
  { name: "Warlock", kind: "criminal", aliases: ["Warlock ransomware"] },
  { name: "Everest", kind: "criminal", aliases: ["Everest ransomware", "Everest gang"] },
  { name: "BianLian", kind: "criminal", aliases: ["BianLian"] },
  { name: "Rhadamanthys", kind: "criminal", aliases: ["Rhadamanthys"] },
  { name: "Anonymous Sudan", kind: "hacktivist", aliases: ["Anonymous Sudan"] },
];
