import type {
  EngineRow,
  GoalRow,
  GscBlock,
  MetrikaBlock,
  PageRow,
  PositionsBlock,
  SourceRow,
  TimelinePoint,
  WmBlock,
} from "./types";

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function rng(seed: string): () => number {
  let t = xmur3(seed)();
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function dateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days + 1);
  return { from: isoDate(from), to: isoDate(to) };
}

export function eachDay(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(isoDate(d));
  }
  return out;
}

export function domainStem(domain: string): string {
  const d = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return d.split(".")[0] || "бренд";
}

const SOURCE_NAMES: [string, string][] = [
  ["organic", "Поисковые системы"],
  ["direct", "Прямые заходы"],
  ["referral", "Ссылки на сайтах"],
  ["social", "Социальные сети"],
  ["ad", "Реклама"],
  ["internal", "Внутренние переходы"],
];

const DEMO_PATHS = [
  "/",
  "/catalog/",
  "/catalog/populyarnoe/",
  "/uslugi/",
  "/blog/kak-vybrat/",
  "/dostavka/",
  "/blog/obzor-2026/",
  "/o-kompanii/",
  "/price/",
  "/contacts/",
];

const DEMO_GOALS = [
  "Заявка с формы",
  "Клик по телефону",
  "Переход в мессенджер",
  "Оформление заказа",
  "Просмотр 3+ страниц",
];

export function demoMetrika(seed: string, days: number): MetrikaBlock {
  const r = rng("metrika:" + seed);
  const base = 250 + Math.floor(r() * 1400);
  const organicShare = 0.5 + r() * 0.25;
  const dates = eachDay(days);

  const timeline: TimelinePoint[] = dates.map((date, i) => {
    const d = new Date(date + "T12:00:00");
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.72 : 1;
    const trend = 1 + (i / days) * 0.18;
    const noise = 0.85 + r() * 0.3;
    const visits = Math.round(base * weekend * trend * noise);
    const users = Math.round(visits * (0.76 + r() * 0.1));
    const organic = Math.round(visits * organicShare * (0.9 + r() * 0.2));
    return { date, visits, users, organic };
  });

  const visits = timeline.reduce((s, p) => s + p.visits, 0);
  const users = timeline.reduce((s, p) => s + p.users, 0);
  const organicVisits = timeline.reduce((s, p) => s + p.organic, 0);
  const pageviews = Math.round(visits * (1.9 + r() * 1.1));
  const bounceRate = Math.round((13 + r() * 18) * 10) / 10;
  const brandShare = 0.18 + r() * 0.22;
  const brandVisits = Math.round(organicVisits * brandShare);

  const weights = [organicShare, 0.12 + r() * 0.08, 0.05 + r() * 0.05, 0.03 + r() * 0.04, 0.02 + r() * 0.08, 0.01 + r() * 0.02];
  const wSum = weights.reduce((s, w) => s + w, 0);
  const sources: SourceRow[] = SOURCE_NAMES.map(([id, name], i) => {
    const share = weights[i] / wSum;
    return { id, name, visits: Math.round(visits * share), share: Math.round(share * 1000) / 10 };
  }).sort((a, b) => b.visits - a.visits);

  const landingPages: PageRow[] = DEMO_PATHS.map((url, i) => ({
    url,
    visits: Math.round(organicVisits * 0.32 * Math.pow(0.7, i) * (0.85 + r() * 0.3)),
    bounceRate: Math.round((8 + r() * 24) * 10) / 10,
  }));

  const goals: GoalRow[] = DEMO_GOALS.map((name, i) => {
    const reaches = Math.round(visits * (0.05 * Math.pow(0.55, i)) * (0.8 + r() * 0.4));
    return {
      id: String(100 + i),
      name,
      reaches,
      conversion: Math.round((reaches / visits) * 1000) / 10,
    };
  }).sort((a, b) => b.reaches - a.reaches);

  const yx = 0.58 + r() * 0.15;
  const searchEngines: EngineRow[] = [
    { name: "Яндекс", visits: Math.round(organicVisits * yx) },
    { name: "Google", visits: Math.round(organicVisits * (1 - yx - 0.03)) },
    { name: "Mail.ru", visits: Math.round(organicVisits * 0.02) },
    { name: "Bing", visits: Math.round(organicVisits * 0.01) },
  ];

  // прошлый период: чуть другой уровень, чтобы дельты выглядели живыми
  const pf = () => 0.8 + r() * 0.36;
  const prevVisits = Math.round(visits * pf());
  const prevOrganic = Math.round(organicVisits * pf());
  const prevBrand = Math.round(brandVisits * pf());

  return {
    live: false,
    totals: {
      visits,
      users,
      pageviews,
      bounceRate,
      organicVisits,
      organicShare: Math.round((organicVisits / visits) * 1000) / 10,
      brandVisits,
      nonBrandVisits: organicVisits - brandVisits,
    },
    prevTotals: {
      visits: prevVisits,
      users: Math.round(users * pf()),
      pageviews: Math.round(pageviews * pf()),
      bounceRate: Math.round(bounceRate * pf() * 10) / 10,
      organicVisits: prevOrganic,
      organicShare: prevVisits ? Math.round((prevOrganic / prevVisits) * 1000) / 10 : 0,
      brandVisits: prevBrand,
      nonBrandVisits: Math.max(prevOrganic - prevBrand, 0),
    },
    timeline,
    sources,
    landingPages,
    goals,
    searchEngines,
  };
}

function demoQueries(seed: string, brand: string): { query: string; weight: number }[] {
  const r = rng("queries:" + seed);
  const templates = [
    brand,
    `${brand} официальный сайт`,
    `${brand} отзывы`,
    `${brand} цена`,
    `купить ${brand}`,
    `${brand} каталог`,
    `как выбрать ${brand}`,
    `${brand} доставка`,
    `${brand} акции`,
    `${brand} под ключ`,
  ];
  return templates.map((query, i) => ({ query, weight: Math.pow(0.68, i) * (0.8 + r() * 0.4) }));
}

export function demoGsc(seed: string, days: number, brand: string): GscBlock {
  const r = rng("gsc:" + seed);
  const baseImp = 800 + Math.floor(r() * 9000);
  const ctr = 0.018 + r() * 0.03;
  const startPos = 9 + r() * 14;
  const dates = eachDay(days);

  const timeline = dates.map((date, i) => {
    const noise = 0.8 + r() * 0.4;
    const impressions = Math.round(baseImp * noise * (1 + (i / days) * 0.15));
    const dayCtr = ctr * (0.85 + r() * 0.3);
    const clicks = Math.round(impressions * dayCtr);
    const position = Math.round((startPos - (i / days) * 1.8 + (r() - 0.5)) * 10) / 10;
    return { date, clicks, impressions, ctr: Math.round(dayCtr * 1000) / 10, position };
  });

  const clicks = timeline.reduce((s, p) => s + p.clicks, 0);
  const impressions = timeline.reduce((s, p) => s + p.impressions, 0);
  const avgPos = timeline.reduce((s, p) => s + p.position, 0) / timeline.length;
  const pf = () => 0.8 + r() * 0.36;
  const prevClicks = Math.round(clicks * pf());
  const prevImpressions = Math.round(impressions * pf());

  const queries = demoQueries(seed, brand).map((q) => {
    const imp = Math.round(impressions * 0.06 * q.weight);
    const c = Math.round(imp * (ctr * 2.2) * q.weight);
    return {
      query: q.query,
      clicks: c,
      impressions: imp,
      ctr: imp ? Math.round((c / imp) * 1000) / 10 : 0,
      position: Math.max(1, Math.round((2 + (1 - q.weight) * 22) * 10) / 10),
    };
  });

  const pages = DEMO_PATHS.slice(0, 8).map((url, i) => ({
    url,
    clicks: Math.round(clicks * 0.3 * Math.pow(0.68, i)),
    impressions: Math.round(impressions * 0.3 * Math.pow(0.7, i)),
  }));

  return {
    live: false,
    totals: {
      clicks,
      impressions,
      ctr: Math.round((clicks / impressions) * 1000) / 10,
      position: Math.round(avgPos * 10) / 10,
    },
    prevTotals: {
      clicks: prevClicks,
      impressions: prevImpressions,
      ctr: prevImpressions ? Math.round((prevClicks / prevImpressions) * 1000) / 10 : 0,
      position: Math.round(avgPos * (0.92 + r() * 0.2) * 10) / 10,
    },
    timeline,
    queries,
    pages,
  };
}

export function demoPositions(seed: string, days: number): PositionsBlock {
  const r = rng("pos:" + seed);
  const keywords = 80 + Math.floor(r() * 900);
  const dates = eachDay(days);
  const startAvg = 14 + r() * 18;
  const startTop10 = 18 + r() * 30;

  const timeline = dates.map((date, i) => {
    const progress = i / Math.max(days - 1, 1);
    return {
      date,
      avgPosition: Math.max(1, Math.round((startAvg - progress * 3.5 + (r() - 0.5) * 1.6) * 10) / 10),
      top10Share: Math.min(95, Math.round((startTop10 + progress * 7 + (r() - 0.5) * 3) * 10) / 10),
    };
  });

  const last = timeline[timeline.length - 1];
  const top10 = Math.round((keywords * last.top10Share) / 100);
  return {
    live: false,
    provider: "demo",
    keywords,
    top3: Math.round(top10 * (0.3 + r() * 0.25)),
    top10,
    avgPosition: last.avgPosition,
    visibility: Math.round((8 + r() * 40) * 10) / 10,
    timeline,
  };
}

export function demoWebmaster(seed: string, brand: string): WmBlock {
  const r = rng("wm:" + seed);
  const searchablePages = 40 + Math.floor(r() * 3800);
  const queries = demoQueries(seed, brand).map((q) => {
    const shows = Math.round((500 + r() * 6000) * q.weight);
    const clicks = Math.round(shows * (0.03 + r() * 0.06) * (q.weight + 0.4));
    return {
      query: q.query,
      shows,
      clicks,
      position: Math.max(1, Math.round((1.5 + (1 - q.weight) * 18) * 10) / 10),
    };
  });
  return {
    live: false,
    sqi: 10 + Math.floor(r() * 1200),
    searchablePages,
    excludedPages: Math.floor(searchablePages * (0.08 + r() * 0.3)),
    queries,
  };
}
