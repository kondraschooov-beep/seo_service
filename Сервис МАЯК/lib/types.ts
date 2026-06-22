export type TimelinePoint = { date: string; visits: number; users: number; organic: number };
export type SourceRow = { id: string; name: string; visits: number; share: number };
export type PageRow = { url: string; visits: number; bounceRate: number };
export type GoalRow = { id: string; name: string; reaches: number; conversion: number };
export type EngineRow = { name: string; visits: number };
export type GscPoint = { date: string; clicks: number; impressions: number; ctr: number; position: number };
export type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
export type WmQueryRow = { query: string; shows: number; clicks: number; position: number };

export type MetrikaTotals = {
  visits: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  organicVisits: number;
  organicShare: number;
  brandVisits: number;
  nonBrandVisits: number;
};

export type MetrikaBlock = {
  live: boolean;
  error?: string;
  totals: MetrikaTotals;
  /** тот же набор за предыдущий период той же длины — для дельт ▲▼ */
  prevTotals?: MetrikaTotals;
  timeline: TimelinePoint[];
  sources: SourceRow[];
  landingPages: PageRow[];
  goals: GoalRow[];
  searchEngines: EngineRow[];
};

export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number };

export type GscBlock = {
  live: boolean;
  error?: string;
  totals: GscTotals;
  prevTotals?: GscTotals;
  timeline: GscPoint[];
  queries: QueryRow[];
  pages: { url: string; clicks: number; impressions: number }[];
};

export type PositionsPoint = { date: string; avgPosition: number; top10Share: number };

export type PositionsBlock = {
  live: boolean;
  error?: string;
  provider: "topvisor" | "keysso" | "demo";
  keywords: number;
  top3: number;
  top10: number;
  avgPosition: number;
  visibility?: number;
  timeline: PositionsPoint[];
};

export type WmBlock = {
  live: boolean;
  error?: string;
  sqi: number;
  searchablePages: number;
  excludedPages: number;
  queries: WmQueryRow[];
};

export type DashboardData = {
  from: string;
  to: string;
  days: number;
  metrika: MetrikaBlock;
  gsc: GscBlock;
  webmaster: WmBlock;
  positions: PositionsBlock;
};

export type ProjectDTO = {
  id: number;
  name: string;
  domain: string;
  logo: string;
  brandKeywords: string;
  metrikaCounterId: string;
  metrikaToken: string;
  gscSiteUrl: string;
  gscCredentials: string;
  wmHostId: string;
  wmToken: string;
  shareToken: string;
  tvToken: string;
  tvUserId: string;
  tvProjectId: string;
  tvRegionIndex: string;
  keyssoToken: string;
  createdAt: string;
};
