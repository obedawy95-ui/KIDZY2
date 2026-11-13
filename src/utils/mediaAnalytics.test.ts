import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMediaSummary,
  evaluateRetentionPolicy,
  groupSnapshotsByPlatform,
  parseAdReportCsv,
} from './mediaAnalytics';
import { MediaCampaignSnapshot, MediaRetentionLog } from '../types/analyticsTools';

const SAMPLE_SNAPSHOTS: MediaCampaignSnapshot[] = [
  {
    id: 's1',
    platform: 'meta',
    accountId: 'act_1',
    campaignName: 'Doha Mascot Booking',
    date: '2026-11-01',
    spendQar: 1000,
    impressions: 50000,
    reach: 35000,
    clicks: 1000,
    conversions: 20,
    revenueQar: 6000,
    videoViews3s: 15000,
    source: 'manual',
  },
  {
    id: 's2',
    platform: 'snapchat',
    accountId: 'act_2',
    campaignName: 'Weekend Kidzy Promo',
    date: '2026-06-01', // older than 90 days relative to 2026-11-13
    spendQar: 500,
    impressions: 25000,
    reach: 20000,
    clicks: 500,
    conversions: 5,
    revenueQar: 1500,
    videoViews3s: 5000,
    source: 'csv',
  },
];

test('calculateMediaSummary returns accurate blended ROAS, CPA, CTR, and Hook Rate', () => {
  const summary = calculateMediaSummary(SAMPLE_SNAPSHOTS);
  assert.equal(summary.totalSpendQar, 1500);
  assert.equal(summary.totalRevenueQar, 7500);
  assert.equal(summary.totalConversions, 25);
  assert.equal(summary.blendedRoas, 5);
  assert.equal(summary.blendedCpaQar, 60);
  assert.equal(summary.ctrPct, 2);
  assert.equal(summary.cpcQar, 1);
  assert.equal(summary.cpmQar, 20);
  assert.equal(summary.aovQar, 300);
  assert.equal(summary.hookRatePct, 26.7);
});

test('groupSnapshotsByPlatform separates metrics per ad channel cleanly', () => {
  const grouped = groupSnapshotsByPlatform(SAMPLE_SNAPSHOTS);
  assert.equal(grouped.meta.count, 1);
  assert.equal(grouped.meta.blendedRoas, 6);
  assert.equal(grouped.snapchat.count, 1);
  assert.equal(grouped.snapchat.blendedRoas, 3);
  assert.equal(grouped.tiktok.count, 0);
});

test('parseAdReportCsv parses standard Meta/Snap/Google CSV exports', () => {
  const csv = [
    'Platform,Campaign,Date,Spend,Impressions,Reach,Clicks,Conversions,Revenue,3s Video Views',
    'meta,"Qatar Family Weekend, Eid",2026-11-10,800,40000,30000,800,10,3200,12000',
    'tiktok,Mascot Surprise Reels,2026-11-11,400,20000,16000,300,4,1200,8000',
  ].join('\n');

  const rows = parseAdReportCsv(csv, 'meta');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].platform, 'meta');
  assert.equal(rows[0].campaignName, 'Qatar Family Weekend, Eid');
  assert.equal(rows[0].spendQar, 800);
  assert.equal(rows[0].revenueQar, 3200);
  assert.equal(rows[1].platform, 'tiktok');
  assert.equal(rows[1].conversions, 4);
});

test('evaluateRetentionPolicy detects records older than 3 months (90d) and 6-month (180d) schedule', () => {
  const now = new Date('2026-11-13T00:00:00Z');
  const oldLog: MediaRetentionLog = {
    id: 'ret_1',
    executedAt: '2026-04-01T00:00:00Z', // > 180 days before 2026-11-13
    triggerType: 'auto-6m-schedule',
    cutoffDate: '2026-01-01',
    deletedCount: 12,
    freedEstimatedKb: 4.5,
    remainingCount: 2,
    notes: 'Previous 6m run',
  };

  const resultDue = evaluateRetentionPolicy(SAMPLE_SNAPSHOTS, [oldLog], now);
  assert.equal(resultDue.expiredCount, 1);
  assert.equal(resultDue.expiredSnapshots[0].id, 's2');
  assert.equal(resultDue.isSixMonthCycleDue, true);

  const recentLog: MediaRetentionLog = {
    ...oldLog,
    executedAt: '2026-10-15T00:00:00Z', // < 180 days ago
  };
  const resultNotDue = evaluateRetentionPolicy(SAMPLE_SNAPSHOTS, [recentLog], now);
  assert.equal(resultNotDue.expiredCount, 1);
  assert.equal(resultNotDue.isSixMonthCycleDue, false);
});
