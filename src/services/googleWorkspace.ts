import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

export function createWorkspaceGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  for (const scope of WORKSPACE_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

// Strict in-memory token cache (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
const tokenListeners = new Set<(token: string | null) => void>();

function notifyTokenListeners() {
  for (const listener of tokenListeners) {
    listener(cachedAccessToken);
  }
}

export function subscribeWorkspaceToken(listener: (token: string | null) => void): () => void {
  tokenListeners.add(listener);
  listener(cachedAccessToken);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function getWorkspaceAccessToken(): string | null {
  return cachedAccessToken;
}

export function setWorkspaceAccessToken(token: string | null): void {
  cachedAccessToken = token || null;
  notifyTokenListeners();
}

export function clearWorkspaceAccessToken(): void {
  cachedAccessToken = null;
  notifyTokenListeners();
}

export function initWorkspaceAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthMissingToken?: () => void
): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        notifyTokenListeners();
        onAuthMissingToken?.();
      }
    } else {
      cachedAccessToken = null;
      notifyTokenListeners();
      onAuthMissingToken?.();
    }
  });
}

export async function connectGoogleWorkspace(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = createWorkspaceGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token.');
    }
    setWorkspaceAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } finally {
    isSigningIn = false;
  }
}

export class WorkspaceApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function workspaceFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getWorkspaceAccessToken();
  if (!token) {
    throw new WorkspaceApiError(401, 'Google Workspace session expired or not signed in.');
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (res.status === 401) {
    clearWorkspaceAccessToken();
    throw new WorkspaceApiError(401, 'Google Workspace authorization expired. Please sign in with Google again.');
  }

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiMsg =
      data?.error?.message ||
      `Google Workspace API request failed with status ${res.status}`;
    throw new WorkspaceApiError(res.status, apiMsg);
  }

  return data as T;
}

export function formatWorkspaceError(error: unknown, lang: 'ar' | 'en'): string {
  if (error instanceof WorkspaceApiError) {
    if (error.status === 401) {
      return lang === 'en'
        ? 'Google session expired or permission is missing. Please sign in with Google again.'
        : 'انتهت جلسة الربط مع Google أو تنقصها الصلاحية. يرجى إعادة تسجيل الدخول بحساب Google.';
    }
    if (error.status === 403) {
      return lang === 'en'
        ? 'You do not have permission to access this spreadsheet or API. Make sure you granted access in the Google sign-in popup.'
        : 'ليس لديكِ صلاحية تعديل هذا الملف أو الوصول إليه. تأكدي من منح الأذونات المطلوبة في نافذة Google.';
    }
    if (error.status === 404) {
      return lang === 'en'
        ? 'Spreadsheet or list not found. Double-check the link or spreadsheet ID.'
        : 'لم يتم العثور على الجدول أو القائمة. تحققي من صحة الرابط أو المعرف.';
    }
    return error.message;
  }
  const code = (error as { code?: string } | null)?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return lang === 'en'
      ? 'Sign-in window closed before completing authorization.'
      : 'تم إغلاق نافذة تسجيل الدخول قبل إتمام الموافقة.';
  }
  if (code === 'auth/popup-blocked') {
    return lang === 'en'
      ? 'Pop-up was blocked by your browser. Please allow pop-ups and try again.'
      : 'حظر المتصفح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجددًا.';
  }
  return error instanceof Error
    ? error.message
    : lang === 'en'
    ? 'Unexpected error while communicating with Google Workspace.'
    : 'حدث خطأ غير متوقع أثناء الاتصال بخدمات Google.';
}

// ==================== GOOGLE SHEETS API v4 ====================

export interface SheetTabMeta {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheets: SheetTabMeta[];
}

export function a1Range(sheetTitle: string, cellRange?: string): string {
  const escapedTitle = sheetTitle.replace(/'/g, "''");
  return cellRange ? `'${escapedTitle}'!${cellRange}` : `'${escapedTitle}'`;
}

export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
  const data = await workspaceFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: {
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }[];
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?includeGridData=false`
  );

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s) => ({
      sheetId: s.properties?.sheetId ?? 0,
      title: s.properties?.title || 'Sheet',
      rowCount: s.properties?.gridProperties?.rowCount ?? 1000,
      columnCount: s.properties?.gridProperties?.columnCount ?? 26,
    })),
  };
}

export async function readSheetRange(
  spreadsheetId: string,
  sheetTitle: string,
  cellRange = 'A1:ZZ250'
): Promise<string[][]> {
  const range = encodeURIComponent(a1Range(sheetTitle, cellRange));
  const data = await workspaceFetch<{ values?: unknown[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`
  );
  return (data.values || []).map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))));
}

export interface CreateWorkbookTabInput {
  title: string;
  values: (string | number | boolean)[][];
  rightToLeft?: boolean;
}

export async function createKidzySpreadsheet(
  workbookTitle: string,
  tabs: CreateWorkbookTabInput[],
  locale = 'ar_SA'
): Promise<SpreadsheetMetadata> {
  const safeTabs = tabs.length > 0 ? tabs : [{ title: 'Responses', values: [['ID']], rightToLeft: false }];

  const created = await workspaceFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: {
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }[];
  }>('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: workbookTitle,
        locale,
      },
      sheets: safeTabs.map((tab, idx) => ({
        properties: {
          sheetId: idx + 1,
          title: tab.title.slice(0, 90),
          rightToLeft: Boolean(tab.rightToLeft),
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      })),
    }),
  });

  const meta: SpreadsheetMetadata = {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
    title: created.properties?.title || workbookTitle,
    sheets: (created.sheets || []).map((s) => ({
      sheetId: s.properties?.sheetId ?? 0,
      title: s.properties?.title || 'Sheet',
      rowCount: s.properties?.gridProperties?.rowCount ?? 1000,
      columnCount: s.properties?.gridProperties?.columnCount ?? 26,
    })),
  };

  // Batch write all tab values
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(meta.spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: safeTabs.map((tab, i) => ({
          range: a1Range(meta.sheets[i]?.title || tab.title, 'A1'),
          majorDimension: 'ROWS',
          values: tab.values,
        })),
      }),
    }
  );

  // Style header rows with Kidzy Ink teal (#063B44) & cream bold text (#FEF4E3)
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(meta.spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: meta.sheets.map((s) => ({
          repeatCell: {
            range: {
              sheetId: s.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.024, green: 0.231, blue: 0.267 },
                textFormat: {
                  foregroundColor: { red: 0.996, green: 0.957, blue: 0.89 },
                  bold: true,
                  fontSize: 10,
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'WRAP',
              },
            },
            fields:
              'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
          },
        })),
      }),
    }
  );

  return meta;
}

export async function ensureSheetTab(
  spreadsheetId: string,
  tabTitle: string,
  rightToLeft = true
): Promise<SheetTabMeta> {
  const meta = await getSpreadsheetMetadata(spreadsheetId);
  const existing = meta.sheets.find((s) => s.title === tabTitle);
  if (existing) return existing;

  const res = await workspaceFetch<{
    replies?: {
      addSheet?: {
        properties?: {
          sheetId?: number;
          title?: string;
          gridProperties?: { rowCount?: number; columnCount?: number };
        };
      };
    }[];
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabTitle.slice(0, 90),
                rightToLeft,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          },
        ],
      }),
    }
  );

  const props = res.replies?.[0]?.addSheet?.properties;
  return {
    sheetId: props?.sheetId ?? 0,
    title: props?.title || tabTitle,
    rowCount: props?.gridProperties?.rowCount ?? 1000,
    columnCount: props?.gridProperties?.columnCount ?? 26,
  };
}

export async function replaceSheetTabValues(
  spreadsheetId: string,
  tabTitle: string,
  values: (string | number | boolean)[][],
  rightToLeft = true
): Promise<SpreadsheetMetadata> {
  const tab = await ensureSheetTab(spreadsheetId, tabTitle, rightToLeft);
  const encodedClearRange = encodeURIComponent(a1Range(tab.title));

  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedClearRange}:clear`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );

  const encodedWriteRange = encodeURIComponent(a1Range(tab.title, 'A1'));
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedWriteRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: a1Range(tab.title, 'A1'),
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: tab.sheetId,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: tab.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.024, green: 0.231, blue: 0.267 },
                  textFormat: {
                    foregroundColor: { red: 0.996, green: 0.957, blue: 0.89 },
                    bold: true,
                    fontSize: 10,
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)',
            },
          },
        ],
      }),
    }
  );

  return getSpreadsheetMetadata(spreadsheetId);
}

export async function appendSheetTabRows(
  spreadsheetId: string,
  tabTitle: string,
  rows: (string | number | boolean)[][],
  headersIfEmpty?: string[],
  rightToLeft = true
): Promise<SpreadsheetMetadata> {
  const tab = await ensureSheetTab(spreadsheetId, tabTitle, rightToLeft);
  const existing = await readSheetRange(spreadsheetId, tab.title, 'A1:B2');
  const toAppend = existing.length === 0 && headersIfEmpty ? [headersIfEmpty, ...rows] : rows;

  const encodedRange = encodeURIComponent(a1Range(tab.title, 'A1'));
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values: toAppend,
      }),
    }
  );

  return getSpreadsheetMetadata(spreadsheetId);
}

// ==================== GOOGLE TASKS API v1 ====================

export interface GoogleTaskListItem {
  id: string;
  title: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export async function listGoogleTaskLists(): Promise<GoogleTaskListItem[]> {
  const data = await workspaceFetch<{ items?: { id: string; title: string }[] }>(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=50'
  );
  return (data.items || []).map((item) => ({ id: item.id, title: item.title }));
}

export async function listGoogleTasks(taskListId: string): Promise<GoogleTaskItem[]> {
  const data = await workspaceFetch<{ items?: GoogleTaskItem[] }>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=false&maxResults=50`
  );
  return data.items || [];
}

export async function createGoogleTask(
  taskListId: string,
  payload: { title: string; notes?: string }
): Promise<GoogleTaskItem> {
  return workspaceFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        notes: payload.notes || '',
      }),
    }
  );
}

export async function updateGoogleTaskStatus(
  taskListId: string,
  taskId: string,
  status: 'needsAction' | 'completed'
): Promise<GoogleTaskItem> {
  return workspaceFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        completed: status === 'completed' ? new Date().toISOString() : null,
      }),
    }
  );
}

export async function deleteGoogleTask(taskListId: string, taskId: string): Promise<void> {
  await workspaceFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
    }
  );
}
