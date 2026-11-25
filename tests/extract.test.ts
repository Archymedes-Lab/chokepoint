import { describe, expect, test } from "bun:test";
import { attribution, buildIncidents, classify, cleanTitle, isAttackHeadline, placeMentions } from "../src/geo/extract";

const art = (title: string, country = "", source = "a.com") => ({ title, url: `https://${source}/${title.length}`, source, country, date: 1 });

describe("cleanTitle", () => {
  test("undoes GDELT tokenisation", () => {
    expect(cleanTitle("U . S . probes cyberattacks , possible Iran link")).toBe("U.S. probes cyberattacks, possible Iran link");
    expect(cleanTitle("El Cajon exposes 7 . 8 terabytes")).toBe("El Cajon exposes 7.8 terabytes");
    expect(cleanTitle("Iran ' s hackers")).toBe("Iran's hackers");
  });
});

describe("relevance", () => {
  test("keeps attacks, drops negations and advice", () => {
    expect(isAttackHeadline("An unclassified CIA system was breached in a cyberattack")).toBe(true);
    expect(isAttackHeadline("Credit union: service disruption caused by power event, not cyberattack")).toBe(false);
    expect(isAttackHeadline("Google warns of faster AI cyberattacks: What companies can do")).toBe(false);
    expect(isAttackHeadline("FAA resumes regular flights after equipment outage")).toBe(false);
    expect(isAttackHeadline("Ukrainian police arrest former members of Conti ransomware group")).toBe(false);
    expect(isAttackHeadline("Dragos: Industrial Ransomware Attacks Rise 11% Led by Qilin")).toBe(false);
  });
});

describe("places", () => {
  test("acronyms are case-sensitive", () => {
    expect(placeMentions("Hackers told us nothing").length).toBe(0);
    expect(placeMentions("US hospitals hit").map((m) => m.place.iso2)).toEqual(["US"]);
  });
});

describe("attribution", () => {
  test("explicit phrasing sets the origin", () => {
    expect(attribution("Iranian hackers target Israel-linked aviation").origin?.iso2).toBe("IR");
    expect(attribution("US probes cyberattacks on ships, possible Iran link").origin?.iso2).toBe("IR");
    expect(attribution("Government investigates Iranian ties to hacked vessels").origin?.iso2).toBe("IR");
    expect(attribution("Breach blamed on China, officials say").origin?.iso2).toBe("CN");
  });
  test("named groups carry their reported origin", () => {
    const a = attribution("Salt Typhoon breached more telecoms");
    expect(a.origin?.iso2).toBe("CN");
    expect(a.actor?.kind).toBe("state");
  });
  test("'links' as a verb is not attribution", () => {
    expect(attribution("Norway links energy firm cyberattacks to cloud flaw").origin).toBeNull();
  });
  test("a bare country mention is not attribution", () => {
    expect(attribution("Japan's Asahi hit by ransomware").origin).toBeNull();
  });
});

describe("classify", () => {
  test("types", () => {
    expect(classify("Hospital hit by ransomware")).toBe("ransomware");
    expect(classify("DDoS knocks sites offline")).toBe("ddos");
    expect(classify("Millions of records exposed in data breach")).toBe("breach");
  });
});

describe("buildIncidents", () => {
  test("merges syndicated copies and resolves victim vs origin", () => {
    const inc = buildIncidents([
      art("An unclassified CIA system was breached in a cyberattack, AP source says", "United States", "a.com"),
      art("CIA system breached in latest cyberattack targeting US intelligence agencies", "India", "b.com"),
      art("China link in CIA data breach? How hackers used AI tool", "India", "c.com"),
      art("Gatwick customer personal data potentially accessed in payment system breach", "United Kingdom", "d.com"),
    ]);
    expect(inc.length).toBe(2);
    const cia = inc.find((i) => i.title.includes("CIA"))!;
    expect(cia.coverage).toBe(3);
    expect(cia.victim?.iso2).toBe("US");
    expect(cia.origin?.iso2).toBe("CN");
    const gat = inc.find((i) => i.title.includes("Gatwick"))!;
    expect(gat.victim?.iso2).toBe("GB");
    expect(gat.origin).toBeNull();
  });
  test("Title Case words don't count as shared names", () => {
    const inc = buildIncidents([
      art("European Commission Uncovers Data Breach In Cyberattack Investigation Using AI Tools", "", "a.com"),
      art("European Commission Confirms Data Stolen In AI-Assisted Cyberattack", "", "c.com"),
      art("AI-Assisted Cyber Attacks Trigger Unauthorized Payments At Indian Banks And Fintech Firms", "", "b.com"),
    ]);
    expect(inc.length).toBe(2);
    expect(inc.find((i) => i.title.includes("Indian"))!.coverage).toBe(1);
    expect(inc.find((i) => i.title.includes("Indian"))!.victim?.iso2).toBe("IN");
  });
  test("falls back to outlet country, flagged approximate", () => {
    const [i] = buildIncidents([art("Major cyberattack hits regional hospital systems", "Kenya")]);
    expect(i.victim).toMatchObject({ iso2: "KE", approx: true });
  });
});
