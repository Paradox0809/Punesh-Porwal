export enum MetricStatus {
  EXCEPTIONAL = "EXCEPTIONAL",
  GOOD = "GOOD",
  MODERATE = "MODERATE",
  WEAK = "WEAK",
  RED_FLAG = "RED_FLAG",
}

export interface Metric {
  label: string;
  value: string | number;
  status: MetricStatus;
  description?: string;
}

export interface PricePoint {
  date: string;
  price: number;
  gmp?: number;
}

export interface IPOAnalysis {
  company: {
    name: string;
    ticker?: string;
    sector: string;
    industry: string;
    founded: string;
    hq: string;
    businessModel: string;
    parent?: string;
  };
  ipoDetails: {
    date: string;
    priceBand: { lower: number; upper: number };
    lotSize: number;
    issueSize: string;
    freshIssue: string;
    ofs: string;
    proceedsUse: string[];
    preIpoInvestors: string[];
    brlm: string;
    registrar: string;
    lockUp: string;
    promoterHolding: Metric;
  };
  valuation: {
    peRatio: Metric;
    pbRatio: Metric;
    evEbitda: Metric;
    marketCap: string;
    listingGainEstimate: Metric;
    dcf?: {
      fairValue: number;
      upside: number;
      assumptions: string[];
    };
    fcf?: {
      yield: number;
      growth: number;
    };
    lbo?: {
      irr: number;
      exitMultiple: number;
    };
    comps?: {
      averagePe: number;
      impliedPrice: number;
    };
  };
  financials: {
    revenue: Metric[]; // Last 3 years
    profit: Metric[]; // Last 3 years
    roe: Metric;
    debtToEquity: Metric;
  };
  risks: {
    title: string;
    severity: MetricStatus;
    description: string;
  }[];
  news: {
    title: string;
    sentiment: "positive" | "neutral" | "negative";
    source: string;
    date: string;
  }[];
  gmp: {
    current: number;
    trend: "up" | "down" | "flat";
    percentage: number;
  };
  priceHistory?: PricePoint[];
  marketTrend?: {
    date: string;
    indexValue: number;
    sentiment: number;
  }[];
  peers: {
    name: string;
    pe: number;
    marketCap: string;
  }[];
  verdict: {
    score: number; // 0-100
    recommendation: "Subscribe" | "Avoid" | "Neutral";
    summary: string;
  };
}
