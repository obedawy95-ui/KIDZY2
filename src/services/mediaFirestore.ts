import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  KidzyPropertyAuditResult,
  MediaAdAccount,
  MediaCampaignSnapshot,
  MediaRetentionLog,
} from '../types/analyticsTools';
import { clampNum, safeId, safeIsoTimestamp, safeStr } from '../utils/surveyLogic';

function stripCreatedAt<T>(raw: Record<string, unknown>): T {
  const { createdAt: _ignored, ...rest } = raw;
  return rest as T;
}

export interface MediaTelemetryCallbacks {
  onAccounts: (accounts: MediaAdAccount[]) => void;
  onSnapshots: (snapshots: MediaCampaignSnapshot[]) => void;
  onRetentionLogs: (logs: MediaRetentionLog[]) => void;
  onPropertyAudits: (audits: KidzyPropertyAuditResult[]) => void;
  onError?: (err: Error) => void;
}

export function subscribeMediaTelemetry(callbacks: MediaTelemetryCallbacks): () => void {
  const unsubscribes: Unsubscribe[] = [];

  const attach = <T>(
    collectionName: string,
    setter: (items: T[]) => void
  ) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) =>
          stripCreatedAt<T>({ id: d.id, ...(d.data() as Record<string, unknown>) })
        );
        setter(items);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        } catch (wrappedErr) {
          if (callbacks.onError && wrappedErr instanceof Error) {
            callbacks.onError(wrappedErr);
          }
        }
      }
    );
    unsubscribes.push(unsub);
  };

  attach<MediaAdAccount>('media_accounts', callbacks.onAccounts);
  attach<MediaCampaignSnapshot>('media_snapshots', callbacks.onSnapshots);
  attach<MediaRetentionLog>('media_retention_logs', callbacks.onRetentionLogs);
  attach<KidzyPropertyAuditResult>('ux_property_audits', callbacks.onPropertyAudits);

  return () => {
    unsubscribes.forEach((u) => u());
  };
}

export async function saveMediaAdAccount(account: MediaAdAccount, isExisting: boolean): Promise<void> {
  const id = safeId(account.id, 'acc');
  const path = `media_accounts/${id}`;

  try {
    if (isExisting) {
      await updateDoc(doc(db, 'media_accounts', id), {
        platform: account.platform,
        accountName: safeStr(account.accountName, 160),
        accountId: safeStr(account.accountId, 128),
        pixelOrTagId: safeStr(account.pixelOrTagId, 128),
        monthlyBudgetQar: clampNum(account.monthlyBudgetQar, 0, 10000000, 0),
        currency: safeStr(account.currency || 'QAR', 16),
        status: account.status,
        lastSyncedAt: safeIsoTimestamp(account.lastSyncedAt),
      });
    } else {
      await setDoc(doc(db, 'media_accounts', id), {
        id,
        platform: account.platform,
        accountName: safeStr(account.accountName, 160),
        accountId: safeStr(account.accountId, 128),
        pixelOrTagId: safeStr(account.pixelOrTagId, 128),
        monthlyBudgetQar: clampNum(account.monthlyBudgetQar, 0, 10000000, 0),
        currency: safeStr(account.currency || 'QAR', 16),
        status: account.status,
        lastSyncedAt: safeIsoTimestamp(account.lastSyncedAt),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteMediaAdAccount(id: string): Promise<void> {
  const cleanId = safeId(id, 'acc');
  try {
    await deleteDoc(doc(db, 'media_accounts', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `media_accounts/${cleanId}`);
  }
}

export async function saveMediaSnapshotsBatch(snapshots: MediaCampaignSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < snapshots.length; i += chunkSize) {
    const chunk = snapshots.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const s of chunk) {
      const id = safeId(s.id, 'snap');
      const payload = {
        id,
        platform: s.platform,
        accountId: safeStr(s.accountId, 128),
        campaignName: safeStr(s.campaignName, 200),
        date: (s.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
        spendQar: clampNum(s.spendQar, 0, 50000000, 0),
        impressions: clampNum(Math.round(s.impressions), 0, 500000000, 0),
        reach: clampNum(Math.round(s.reach), 0, 500000000, 0),
        clicks: clampNum(Math.round(s.clicks), 0, 100000000, 0),
        conversions: clampNum(Math.round(s.conversions), 0, 10000000, 0),
        revenueQar: clampNum(s.revenueQar, 0, 100000000, 0),
        videoViews3s: clampNum(Math.round(s.videoViews3s), 0, 500000000, 0),
        source: s.source,
        createdAt: serverTimestamp(),
      };
      batch.set(doc(db, 'media_snapshots', id), payload);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'media_snapshots');
    }
  }
}

export async function executeThreeMonthRetentionPrune(
  expiredIds: string[],
  logRecord: MediaRetentionLog
): Promise<void> {
  if (expiredIds.length > 0) {
    const chunkSize = 400;
    for (let i = 0; i < expiredIds.length; i += chunkSize) {
      const chunk = expiredIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const snapId of chunk) {
        batch.delete(doc(db, 'media_snapshots', safeId(snapId, 'snap')));
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'media_snapshots');
      }
    }
  }

  const cleanLogId = safeId(logRecord.id, 'ret');
  try {
    await setDoc(doc(db, 'media_retention_logs', cleanLogId), {
      id: cleanLogId,
      executedAt: safeIsoTimestamp(logRecord.executedAt),
      triggerType: logRecord.triggerType,
      cutoffDate: safeStr(logRecord.cutoffDate, 32),
      deletedCount: clampNum(Math.round(logRecord.deletedCount), 0, 1000000, 0),
      freedEstimatedKb: clampNum(logRecord.freedEstimatedKb, 0, 10000000, 0),
      remainingCount: clampNum(Math.round(logRecord.remainingCount), 0, 1000000, 0),
      notes: safeStr(logRecord.notes, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `media_retention_logs/${cleanLogId}`);
  }
}

export async function saveUxPropertyAudit(audit: KidzyPropertyAuditResult): Promise<void> {
  const id = safeId(audit.id, 'audit');
  const path = `ux_property_audits/${id}`;
  try {
    await setDoc(doc(db, 'ux_property_audits', id), {
      id,
      inspectedAt: safeIsoTimestamp(audit.inspectedAt),
      website: audit.website,
      iosApp: audit.iosApp,
      androidApp: audit.androidApp,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
