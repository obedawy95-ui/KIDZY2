import {
  MediaBlendedSummary,
  MediaCampaignSnapshot,
  MediaPlatformKey,
  MediaRetentionLog,
} from '../types/analyticsTools';

export const RETENTION_CUTOFF_DAYS = 90; // Delete records older than 3 months (90 days)
export const RETENTION_CYCLE_DAYS = 180; // Trigger check every 6 months (180 days)
export const RETENTION_STORAGE_WARN_BYTES = 250 * 1024; // 250 KB threshold warning indicator

export function calculateMediaSummary(snapshots: MediaCampaignSnapshot[]): MediaBlendedSummary {
  if (snapshots.length === 0) {
    return {
      totalSpendQar: 0,
      totalRevenueQar: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalClicks: 0,
      totalConversions: 0,
      blendedRoas: 0,
      blendedCpaQar: 0,
      ctrPct: 0,
      cpcQar: 0,
      cpmQar: 0,
      conversionRatePct: 0,
      hookRatePct: 0,
      aovQar: 0,
      frequency: 0,
    };
  }

  let totalSpendQar = 0;
  let totalRevenueQar = 0;
  let totalImpressions = 0;
  let totalReach = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalVideoViews3s = 0;

  for (const s of snapshots) {
    totalSpendQar += Math.max(0, Number(s.spendQar) || 0);
    totalRevenueQar += Math.max(0, Number(s.revenueQar) || 0);
    totalImpressions += Math.max(0, Number(s.impressions) || 0);
    totalReach += Math.max(0, Number(s.reach) || 0);
    totalClicks += Math.max(0, Number(s.clicks) || 0);
    totalConversions += Math.max(0, Number(s.conversions) || 0);
    totalVideoViews3s += Math.max(0, Number(s.videoViews3s) || 0);
  }

  const blendedRoas = totalSpendQar > 0 ? Number((totalRevenueQar / totalSpendQar).toFixed(2)) : 0;
  const blendedCpaQar = totalConversions > 0 ? Number((totalSpendQar / totalConversions).toFixed(1)) : 0;
  const ctrPct = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const cpcQar = totalClicks > 0 ? Number((totalSpendQar / totalClicks).toFixed(2)) : 0;
  const cpmQar = totalImpressions > 0 ? Number(((totalSpendQar / totalImpressions) * 1000).toFixed(2)) : 0;
  const conversionRatePct = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;
  const hookRatePct = totalImpressions > 0 ? Number(((totalVideoViews3s / totalImpressions) * 100).toFixed(1)) : 0;
  const aovQar = totalConversions > 0 ? Number((totalRevenueQar / totalConversions).toFixed(0)) : 0;
  const frequency = totalReach > 0 ? Number((totalImpressions / totalReach).toFixed(2)) : 0;

  return {
    totalSpendQar: Number(totalSpendQar.toFixed(2)),
    totalRevenueQar: Number(totalRevenueQar.toFixed(2)),
    totalImpressions,
    totalReach,
    totalClicks,
    totalConversions,
    blendedRoas,
    blendedCpaQar,
    ctrPct,
    cpcQar,
    cpmQar,
    conversionRatePct,
    hookRatePct,
    aovQar,
    frequency,
  };
}

export function groupSnapshotsByPlatform(
  snapshots: MediaCampaignSnapshot[]
): Record<MediaPlatformKey, MediaBlendedSummary & { count: number }> {
  const platforms: MediaPlatformKey[] = [
    'meta',
    'snapchat',
    'tiktok',
    'google_ads',
    'kidzy_store',
  ];

  const grouped = {} as Record<MediaPlatformKey, MediaBlendedSummary & { count: number }>;
  for (const platform of platforms) {
    const filtered = snapshots.filter((s) => s.platform === platform);
    grouped[platform] = {
      ...calculateMediaSummary(filtered),
      count: filtered.length,
    };
  }
  return grouped;
}

/**
 * Computes retention cutoff timestamp (now - 90 days) and determines
 * whether a 6-month (180-day) automatic prune cycle is due.
 */
export function evaluateRetentionPolicy(
  snapshots: MediaCampaignSnapshot[],
  retentionLogs: MediaRetentionLog[],
  now: Date = new Date()
) {
  const cutoffDateObj = new Date(now.getTime() - RETENTION_CUTOFF_DAYS * 24 * 60 * 60 * 1000);
  const cutoffIsoDate = cutoffDateObj.toISOString().slice(0, 10);

  const expiredSnapshots = snapshots.filter((s) => {
    const parsed = Date.parse(s.date);
    return !Number.isNaN(parsed) && parsed < cutoffDateObj.getTime();
  });

  const sortedLogs = [...retentionLogs].sort(
    (a, b) => Date.parse(b.executedAt) - Date.parse(a.executedAt)
  );
  const lastLog = sortedLogs[0] || null;
  const lastPrunedMs = lastLog ? Date.parse(lastLog.executedAt) : null;

  const daysSinceLastPrune =
    lastPrunedMs !== null && !Number.isNaN(lastPrunedMs)
      ? Math.floor((now.getTime() - lastPrunedMs) / (24 * 60 * 60 * 1000))
      : null;

  const isSixMonthCycleDue =
    daysSinceLastPrune !== null
      ? daysSinceLastPrune >= RETENTION_CYCLE_DAYS && expiredSnapshots.length > 0
      : expiredSnapshots.length > 0 && snapshots.length >= 25;

  const nextScheduledDate =
    lastPrunedMs !== null && !Number.isNaN(lastPrunedMs)
      ? new Date(lastPrunedMs + RETENTION_CYCLE_DAYS * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + RETENTION_CYCLE_DAYS * 24 * 60 * 60 * 1000);

  const estimatedBytes = snapshots.reduce((sum, item) => sum + JSON.stringify(item).length, 0);
  const estimatedKb = Number((estimatedBytes / 1024).toFixed(1));
  const isStorageHeavy = estimatedBytes >= RETENTION_STORAGE_WARN_BYTES || snapshots.length >= 500;

  return {
    cutoffIsoDate,
    expiredSnapshots,
    expiredCount: expiredSnapshots.length,
    daysSinceLastPrune,
    isSixMonthCycleDue,
    nextScheduledIsoDate: nextScheduledDate.toISOString().slice(0, 10),
    estimatedBytes,
    estimatedKb,
    isStorageHeavy,
    lastLog,
  };
}

function normalizePlatformHeader(raw: string): MediaPlatformKey {
  const val = raw.trim().toLowerCase();
  if (val.includes('meta') || val.includes('insta') || val.includes('fb') || val.includes('facebook')) {
    return 'meta';
  }
  if (val.includes('snap')) return 'snapchat';
  if (val.includes('tik')) return 'tiktok';
  if (val.includes('google') || val.includes('gads') || val.includes('search') || val.includes('youtube')) {
    return 'google_ads';
  }
  return 'kidzy_store';
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parses CSV exports from Meta Ads, Snapchat Ads, TikTok Ads, Google Ads, or Kidzy Store.
 */
export function parseAdReportCsv(
  csvText: string,
  defaultPlatform: MediaPlatformKey = 'meta'
): MediaCampaignSnapshot[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const findCol = (aliases: string[]) =>
    headers.findIndex((h) => aliases.some((alias) => h.includes(alias)));

  const colPlatform = findCol(['platform', 'channel', 'source', 'المنصة']);
  const colCampaign = findCol(['campaign', 'ad set', 'name', 'الحملة']);
  const colDate = findCol(['date', 'day', 'reporting', 'التاريخ']);
  const colSpend = findCol(['spend', 'cost', 'amount spent', 'الإنفاق']);
  const colImpr = findCol(['impressions', 'impr', 'الظهور']);
  const colReach = findCol(['reach', 'الوصول']);
  const colClicks = findCol(['clicks', 'link clicks', 'النقرات']);
  const colConv = findCol(['conversions', 'purchases', 'bookings', 'orders', 'التحويلات', 'الحجوزات']);
  const colRev = findCol(['revenue', 'conversion value', 'purchase value', 'sales', 'العائد', 'الإيراد']);
  const colViews = findCol(['3-second', '3s', 'video views', 'hook', 'مشاهدات']);

  const parsed: MediaCampaignSnapshot[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const toNum = (idx: number) => {
      if (idx < 0 || idx >= cols.length) return 0;
      const cleaned = cols[idx].replace(/[^0-9.-]/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    };

    const platform =
      colPlatform >= 0 && cols[colPlatform]
        ? normalizePlatformHeader(cols[colPlatform])
        : defaultPlatform;

    const campaignName =
      (colCampaign >= 0 && cols[colCampaign]) || `Campaign #${i}`;
    const rawDate = colDate >= 0 && cols[colDate] ? cols[colDate].slice(0, 10) : todayIso;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayIso;

    const impressions = Math.round(toNum(colImpr));
    const reach = Math.round(toNum(colReach)) || Math.round(impressions * 0.72);
    const spendQar = Number(toNum(colSpend).toFixed(2));
    const clicks = Math.round(toNum(colClicks));
    const conversions = Math.round(toNum(colConv));
    const revenueQar = Number(toNum(colRev).toFixed(2));
    const videoViews3s = Math.round(toNum(colViews));

    parsed.push({
      id: `snap_${platform}_${validDate}_${Date.now()}_${i}`,
      platform,
      accountId: `acc_${platform}_default`,
      campaignName: campaignName.slice(0, 160),
      date: validDate,
      spendQar,
      impressions,
      reach,
      clicks,
      conversions,
      revenueQar,
      videoViews3s,
      source: 'csv',
    });
  }

  return parsed;
}
