// Data contracts for Digital Performance (GA4), User Experience KPIs (Clarity, Hotjar, Firebase),
// Live Kidzy Properties Inspection, and Media KPIs & AI Marketing Advisory

export type TimeframeOption = 'today' | '7d' | '30d' | '90d';

export interface GA4TrafficSource {
  channel: string;
  channelEn: string;
  sessions: number;
  users: number;
  bounceRatePct: number;
  avgDurationSec: number;
  conversionRatePct: number;
  sharePct: number;
}

export interface GA4ConversionStage {
  id: string;
  nameAr: string;
  nameEn: string;
  count: number;
  dropoffPct: number;
  stepConversionPct: number;
}

export interface GA4CustomEvent {
  eventName: string;
  category: string;
  count: number;
  uniqueUsers: number;
  descriptionAr: string;
  descriptionEn: string;
  lastFired?: string;
}

export interface GA4Config {
  measurementId: string;
  streamName: string;
  status: 'connected' | 'simulated' | 'pending';
  lastPingTime?: string;
}

export interface ClarityFrictionMetric {
  id: 'rage_clicks' | 'dead_clicks' | 'excessive_scrolling' | 'quick_backs';
  titleAr: string;
  titleEn: string;
  valuePct: number;
  healthyBenchmarkPct: number;
  status: 'good' | 'warning' | 'alert';
  descriptionAr: string;
  descriptionEn: string;
}

export interface ClarityHeatmapZone {
  id: string;
  targetElementAr: string;
  targetElementEn: string;
  xPercent: number;
  yPercent: number;
  clickDensityPct: number;
  rageClicksCount: number;
}

export interface HotjarFeedbackItem {
  id: string;
  customerRoleAr: string;
  customerRoleEn: string;
  date: string;
  score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  quoteAr: string;
  quoteEn: string;
  contextPage: string;
}

export interface FirebaseCrashIssue {
  id: string;
  exceptionName: string;
  deviceModel: string;
  osVersion: string;
  occurrencesCount: number;
  affectedUsersCount: number;
  status: 'open' | 'investigating' | 'resolved';
  firstSeen: string;
  lastSeen: string;
}

export interface FirebaseNetworkEndpointMetric {
  endpointName: string;
  method: 'GET' | 'POST' | 'FIRESTORE';
  avgLatencyMs: number;
  failureRatePct: number;
  requestsCount24h: number;
}

export interface UXKpiToolSelection {
  activeTool: 'clarity' | 'hotjar' | 'firebase';
}

export type UxPlatformFilter = 'all' | 'web' | 'ios' | 'android';

export interface DetectedTrackingPixels {
  ga4: boolean;
  gtm: boolean;
  clarity: boolean;
  hotjar: boolean;
  metaPixel: boolean;
  snapPixel: boolean;
  tiktokPixel: boolean;
}

export interface KidzyPropertyAuditResult {
  id: string;
  inspectedAt: string;
  website: {
    url: string;
    reachable: boolean;
    httpStatus: number;
    latencyMs: number;
    sslEnabled: boolean;
    hasMobileViewport: boolean;
    title: string;
    metaDescription: string;
    detectedPixels: DetectedTrackingPixels;
    error?: string;
  };
  iosApp: {
    url: string;
    appId: string;
    reachable: boolean;
    trackName: string;
    version: string;
    averageRating: number;
    ratingCount: number;
    sellerName: string;
    bundleId: string;
    releaseDate: string;
    iconUrl: string;
    error?: string;
  };
  androidApp: {
    url: string;
    packageId: string;
    reachable: boolean;
    httpStatus: number;
    title: string;
    ratingText: string;
    downloadsText: string;
    error?: string;
  };
}

// ================= Media KPIs & Retention Policy =================
export type MediaPlatformKey =
  | 'meta'
  | 'snapchat'
  | 'tiktok'
  | 'google_ads'
  | 'kidzy_store';

export type MediaAccountStatus = 'connected' | 'paused' | 'attention';

export interface MediaAdAccount {
  id: string;
  platform: MediaPlatformKey;
  accountName: string;
  accountId: string;
  pixelOrTagId: string;
  monthlyBudgetQar: number;
  currency: string;
  status: MediaAccountStatus;
  lastSyncedAt: string;
  createdAt?: unknown;
}

export interface MediaCampaignSnapshot {
  id: string;
  platform: MediaPlatformKey;
  accountId: string;
  campaignName: string;
  date: string; // YYYY-MM-DD
  spendQar: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number; // Bookings / Orders
  revenueQar: number;
  videoViews3s: number;
  source: 'manual' | 'csv' | 'webhook' | 'sync';
  createdAt?: unknown;
}

export interface MediaRetentionLog {
  id: string;
  executedAt: string;
  triggerType: 'auto-6m-schedule' | 'manual';
  cutoffDate: string; // ISO date (90 days prior)
  deletedCount: number;
  freedEstimatedKb: number;
  remainingCount: number;
  notes: string;
  createdAt?: unknown;
}

export interface MediaBlendedSummary {
  totalSpendQar: number;
  totalRevenueQar: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalConversions: number;
  blendedRoas: number;
  blendedCpaQar: number;
  ctrPct: number;
  cpcQar: number;
  cpmQar: number;
  conversionRatePct: number;
  hookRatePct: number;
  aovQar: number;
  frequency: number;
}

export type MarketingAdvisoryFocus =
  | 'overall_roas'
  | 'reduce_cpa'
  | 'budget_reallocation'
  | 'creatives_hooks'
  | 'store_app_cro'
  | 'launch_roadmap';

export interface AiMarketingRecommendation {
  generatedAt: string;
  model: string;
  executiveDiagnosisAr: string;
  executiveDiagnosisEn: string;
  healthScore: number; // 0-100
  priorityActions: {
    titleAr: string;
    titleEn: string;
    channel: string;
    impact: 'high' | 'medium';
    actionAr: string;
    actionEn: string;
    expectedLiftAr: string;
    expectedLiftEn: string;
  }[];
  budgetAllocation: {
    platform: string;
    currentSharePct: number;
    recommendedSharePct: number;
    rationaleAr: string;
    rationaleEn: string;
  }[];
  adHooksAndCopy: {
    angleAr: string;
    angleEn: string;
    hookAr: string;
    hookEn: string;
    targetAudienceAr: string;
    targetAudienceEn: string;
  }[];
  thirtyDayRoadmap: {
    weekLabelAr: string;
    weekLabelEn: string;
    focusAr: string;
    focusEn: string;
  }[];
}
