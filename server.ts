import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KIDZY_WEBSITE_URL = 'https://kidzy.qa/?lang=en';
const KIDZY_IOS_URL = 'https://apps.apple.com/us/app/kidzy-app/id1607986658';
const KIDZY_IOS_LOOKUP_URL = 'https://itunes.apple.com/lookup?id=1607986658';
const KIDZY_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.kidzy.qa&hl=en&gl=qa';

async function fetchWithTimeout(url: string, timeoutMs = 8000, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        ...headers,
      },
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      latencyMs: Date.now() - startedAt,
      text,
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractTagContent(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return m && m[1] ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function detectPixelsInHtml(html: string) {
  const lower = html.toLowerCase();
  return {
    ga4: /googletagmanager\.com\/gtag\/js\?id=g-|gtag\(['"]config['"],\s*['"]g-|'g-[a-z0-9]+'|"g-[a-z0-9]+"/i.test(html),
    gtm: /googletagmanager\.com\/gtm\.js|gtm-[a-z0-9]{4,}/i.test(html),
    clarity: lower.includes('clarity.ms') || lower.includes('window.clarity'),
    hotjar: lower.includes('static.hotjar.com') || lower.includes('hotjar.com') || lower.includes('hjid'),
    metaPixel: lower.includes('connect.facebook.net') || lower.includes('fbevents.js') || lower.includes('fbq('),
    snapPixel: lower.includes('sc-static.net/scevent') || lower.includes('snaptr('),
    tiktokPixel: lower.includes('analytics.tiktok.com') || lower.includes('ttq.load'),
  };
}

async function inspectKidzyProperties() {
  const inspectedAt = new Date().toISOString();

  const [webRes, iosRes, androidRes] = await Promise.allSettled([
    fetchWithTimeout(KIDZY_WEBSITE_URL, 9000),
    fetchWithTimeout(KIDZY_IOS_LOOKUP_URL, 8000, { Accept: 'application/json' }),
    fetchWithTimeout(KIDZY_ANDROID_URL, 8000),
  ]);

  let website = {
    url: KIDZY_WEBSITE_URL,
    reachable: false,
    httpStatus: 0,
    latencyMs: 0,
    sslEnabled: true,
    hasMobileViewport: false,
    title: '',
    metaDescription: '',
    detectedPixels: {
      ga4: false,
      gtm: false,
      clarity: false,
      hotjar: false,
      metaPixel: false,
      snapPixel: false,
      tiktokPixel: false,
    },
    error: undefined as string | undefined,
  };

  if (webRes.status === 'fulfilled') {
    const html = webRes.value.text || '';
    const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDesc =
      extractTagContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      extractTagContent(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    website = {
      url: webRes.value.finalUrl || KIDZY_WEBSITE_URL,
      reachable: webRes.value.ok,
      httpStatus: webRes.value.status,
      latencyMs: webRes.value.latencyMs,
      sslEnabled: (webRes.value.finalUrl || KIDZY_WEBSITE_URL).startsWith('https://'),
      hasMobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
      title: title.slice(0, 160),
      metaDescription: metaDesc.slice(0, 300),
      detectedPixels: detectPixelsInHtml(html),
      error: webRes.value.ok ? undefined : `HTTP ${webRes.value.status}`,
    };
  } else {
    website.error = webRes.reason instanceof Error ? webRes.reason.message : 'Website unreachable';
  }

  let iosApp = {
    url: KIDZY_IOS_URL,
    appId: '1607986658',
    reachable: false,
    trackName: 'Kidzy App',
    version: '—',
    averageRating: 0,
    ratingCount: 0,
    sellerName: 'Kidzy',
    bundleId: '',
    releaseDate: '',
    iconUrl: '',
    error: undefined as string | undefined,
  };

  if (iosRes.status === 'fulfilled' && iosRes.value.ok) {
    try {
      const parsed = JSON.parse(iosRes.value.text) as {
        resultCount?: number;
        results?: Array<Record<string, unknown>>;
      };
      const item = parsed.results && parsed.results[0];
      if (item) {
        iosApp = {
          url: KIDZY_IOS_URL,
          appId: '1607986658',
          reachable: true,
          trackName: String(item.trackName || 'Kidzy App'),
          version: String(item.version || '—'),
          averageRating: Number(item.averageUserRating || 0),
          ratingCount: Number(item.userRatingCount || 0),
          sellerName: String(item.sellerName || item.artistName || 'Kidzy'),
          bundleId: String(item.bundleId || ''),
          releaseDate: String(item.currentVersionReleaseDate || item.releaseDate || '').slice(0, 10),
          iconUrl: String(item.artworkUrl100 || item.artworkUrl60 || ''),
          error: undefined,
        };
      } else {
        iosApp.error = 'App ID 1607986658 not found in lookup';
      }
    } catch (err) {
      iosApp.error = err instanceof Error ? err.message : 'Failed parsing iTunes API';
    }
  } else if (iosRes.status === 'rejected') {
    iosApp.error = iosRes.reason instanceof Error ? iosRes.reason.message : 'iOS lookup unreachable';
  } else {
    iosApp.error = `HTTP ${iosRes.value.status}`;
  }

  let androidApp = {
    url: 'https://play.google.com/store/apps/details?id=com.kidzy.qa',
    packageId: 'com.kidzy.qa',
    reachable: false,
    httpStatus: 0,
    title: 'Kidzy (com.kidzy.qa)',
    ratingText: '—',
    downloadsText: '—',
    error: undefined as string | undefined,
  };

  if (androidRes.status === 'fulfilled') {
    const html = androidRes.value.text || '';
    const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
      .replace(/\s*-\s*Apps on Google Play/i, '')
      .trim();
    const ratingMatch = html.match(/Rated\s+([0-9.]+)\s+stars\s+out\s+of\s+five/i);
    const dlMatch = html.match(/([0-9,.]+\+?\s*(?:K|M)?)\s*Downloads/i);
    androidApp = {
      url: 'https://play.google.com/store/apps/details?id=com.kidzy.qa',
      packageId: 'com.kidzy.qa',
      reachable: androidRes.value.ok,
      httpStatus: androidRes.value.status,
      title: (title || 'Kidzy App').slice(0, 120),
      ratingText: ratingMatch ? `${ratingMatch[1]} / 5` : 'Live Listing',
      downloadsText: dlMatch ? dlMatch[1].trim() : 'Active',
      error: androidRes.value.ok ? undefined : `HTTP ${androidRes.value.status}`,
    };
  } else {
    androidApp.error = androidRes.reason instanceof Error ? androidRes.reason.message : 'Play Store unreachable';
  }

  return {
    id: `audit_${Date.now()}`,
    inspectedAt,
    website,
    iosApp,
    androidApp,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'kidzy-kpis', timestamp: new Date().toISOString() });
  });

  app.get('/api/ux/inspect-properties', async (_req: Request, res: Response) => {
    try {
      const audit = await inspectKidzyProperties();
      res.json(audit);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed inspecting Kidzy properties',
      });
    }
  });

  app.post('/api/media/webhook', (req: Request, res: Response) => {
    const payload = (req.body || {}) as Record<string, unknown>;
    const normalized = {
      id: `wh_${Date.now()}`,
      platform: String(payload.platform || 'kidzy_store'),
      accountId: String(payload.accountId || 'webhook_ingest'),
      campaignName: String(payload.campaignName || payload.campaign || 'Store / Ad Webhook Event'),
      date: String(payload.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
      spendQar: Math.max(0, Number(payload.spendQar ?? payload.spend ?? 0) || 0),
      impressions: Math.max(0, Math.round(Number(payload.impressions ?? 0) || 0)),
      reach: Math.max(0, Math.round(Number(payload.reach ?? 0) || 0)),
      clicks: Math.max(0, Math.round(Number(payload.clicks ?? 0) || 0)),
      conversions: Math.max(0, Math.round(Number(payload.conversions ?? payload.orders ?? 1) || 0)),
      revenueQar: Math.max(0, Number(payload.revenueQar ?? payload.revenue ?? 0) || 0),
      videoViews3s: Math.max(0, Math.round(Number(payload.videoViews3s ?? 0) || 0)),
      source: 'webhook' as const,
    };
    res.status(200).json({ accepted: true, normalizedSnapshot: normalized });
  });

  app.post('/api/media/ai-recommendations', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    try {
      const body = (req.body || {}) as {
        focus?: string;
        customQuestion?: string;
        summary?: Record<string, unknown>;
        platformBreakdown?: Record<string, unknown>;
        accounts?: Array<Record<string, unknown>>;
        propertyAudit?: Record<string, unknown> | null;
        surveyInsights?: Record<string, unknown>;
      };

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const modelName = 'gemini-4-hydrogen';

      const systemInstruction = `You are a Principal Performance Marketing Director & Growth Strategist with 10+ years of hands-on experience scaling family entertainment, kids gifting, and local home-visit experiential apps in Qatar and the GCC (specifically Kidzy Qatar: https://kidzy.qa, iOS App id1607986658, Android com.kidzy.qa).

Your task is to analyze Kidzy's live paid media metrics (Meta Ads, Snapchat Ads, TikTok Ads, Google Ads, Kidzy Store in QAR), pixel/store telemetry, and live voice-of-customer survey findings (mothers pricing feedback, 10-minute mascot visit duration awareness, sibling extra car toys upsell demand, app checkout friction), and deliver deeply practical, mathematically grounded executive recommendations in BOTH Arabic and English.

Be concrete, avoid generic fluff, reference Kidzy's exact metrics/numbers provided in context, highlight ROAS/CPA/Hook-Rate/Pixel gaps, and propose high-converting creative angles, budget shifts, and funnel CRO fixes.`;

      const prompt = JSON.stringify(
        {
          advisoryFocus: body.focus || 'overall_roas',
          customUserQuestion: body.customQuestion || '',
          blendedMediaSummaryQar: body.summary || {},
          channelBreakdown: body.platformBreakdown || {},
          connectedAdAccounts: body.accounts || [],
          liveWebAndAppAudit: body.propertyAudit || null,
          fieldSurveySignals: body.surveyInsights || {},
        },
        null,
        2
      );

      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Analyze this live Kidzy Qatar performance & UX dataset and generate your 10+ year Senior Marketing Advisory JSON report:\n\n${prompt}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveDiagnosisAr: { type: Type.STRING },
              executiveDiagnosisEn: { type: Type.STRING },
              healthScore: { type: Type.NUMBER },
              priorityActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titleAr: { type: Type.STRING },
                    titleEn: { type: Type.STRING },
                    channel: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ['high', 'medium'] },
                    actionAr: { type: Type.STRING },
                    actionEn: { type: Type.STRING },
                    expectedLiftAr: { type: Type.STRING },
                    expectedLiftEn: { type: Type.STRING },
                  },
                  required: [
                    'titleAr',
                    'titleEn',
                    'channel',
                    'impact',
                    'actionAr',
                    'actionEn',
                    'expectedLiftAr',
                    'expectedLiftEn',
                  ],
                },
              },
              budgetAllocation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING },
                    currentSharePct: { type: Type.NUMBER },
                    recommendedSharePct: { type: Type.NUMBER },
                    rationaleAr: { type: Type.STRING },
                    rationaleEn: { type: Type.STRING },
                  },
                  required: [
                    'platform',
                    'currentSharePct',
                    'recommendedSharePct',
                    'rationaleAr',
                    'rationaleEn',
                  ],
                },
              },
              adHooksAndCopy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    angleAr: { type: Type.STRING },
                    angleEn: { type: Type.STRING },
                    hookAr: { type: Type.STRING },
                    hookEn: { type: Type.STRING },
                    targetAudienceAr: { type: Type.STRING },
                    targetAudienceEn: { type: Type.STRING },
                  },
                  required: [
                    'angleAr',
                    'angleEn',
                    'hookAr',
                    'hookEn',
                    'targetAudienceAr',
                    'targetAudienceEn',
                  ],
                },
              },
              thirtyDayRoadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    weekLabelAr: { type: Type.STRING },
                    weekLabelEn: { type: Type.STRING },
                    focusAr: { type: Type.STRING },
                    focusEn: { type: Type.STRING },
                  },
                  required: ['weekLabelAr', 'weekLabelEn', 'focusAr', 'focusEn'],
                },
              },
            },
            required: [
              'executiveDiagnosisAr',
              'executiveDiagnosisEn',
              'healthScore',
              'priorityActions',
              'budgetAllocation',
              'adHooksAndCopy',
              'thirtyDayRoadmap',
            ],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      res.json({
        generatedAt: new Date().toISOString(),
        model: modelName,
        ...parsed,
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'AI marketing advisory request failed',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kidzy KPIs full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
