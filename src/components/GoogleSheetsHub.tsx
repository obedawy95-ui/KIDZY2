import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CustomerServiceSurveyResponse,
  DriverSurveyResponse,
  MotherSurveyResponse,
  OperationsSurveyResponse,
  PostVisitLog,
  StaffSurveyResponse,
  SurveyTypeKey,
} from '../types/survey';
import { useLanguage } from '../context/LanguageContext';
import {
  appendSheetTabRows,
  clearWorkspaceAccessToken,
  connectGoogleWorkspace,
  createGoogleTask,
  createKidzySpreadsheet,
  deleteGoogleTask,
  formatWorkspaceError,
  getSpreadsheetMetadata,
  getWorkspaceAccessToken,
  GoogleTaskItem,
  GoogleTaskListItem,
  listGoogleTaskLists,
  listGoogleTasks,
  readSheetRange,
  replaceSheetTabValues,
  SpreadsheetMetadata,
  subscribeWorkspaceToken,
  updateGoogleTaskStatus,
  WorkspaceApiError,
} from '../services/googleWorkspace';
import {
  buildStaffKpiSummaryTable,
  buildSurveySheetTable,
  extractSpreadsheetIdFromInput,
} from '../utils/sheetsSerializer';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WorkspaceConfirmModal, WorkspaceConfirmPayload } from './WorkspaceConfirmModal';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Table,
  Trash2,
  UploadCloud,
} from 'lucide-react';

export type SheetsExportSource = SurveyTypeKey | 'all-workbook' | 'staff-summary';

interface GoogleSheetsHubProps {
  currentUser: User | null;
  postVisitLogs: PostVisitLog[];
  staffSurveys: StaffSurveyResponse[];
  motherSurveys: MotherSurveyResponse[];
  driverSurveys: DriverSurveyResponse[];
  csSurveys: CustomerServiceSurveyResponse[];
  opsSurveys: OperationsSurveyResponse[];
  initialExportSource?: SheetsExportSource;
  draftTaskInput?: { title: string; notes: string } | null;
  onClearDraftTask?: () => void;
}

export const GoogleSheetsHub: React.FC<GoogleSheetsHubProps> = ({
  currentUser,
  postVisitLogs,
  staffSurveys,
  motherSurveys,
  driverSurveys,
  csSurveys,
  opsSurveys,
  initialExportSource = 'staff-survey',
  draftTaskInput,
  onClearDraftTask,
}) => {
  const { lang, dir, t } = useLanguage();

  const [accessToken, setAccessToken] = useState<string | null>(() => getWorkspaceAccessToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync / Create Spreadsheet state
  const [exportSource, setExportSource] = useState<SheetsExportSource>(initialExportSource);
  const [newSheetTitle, setNewSheetTitle] = useState(
    t('kidzy kpi,s — سجل الاستبيانات الميدانية', 'kidzy kpi,s — Field Surveys Workbook')
  );
  const [sheetUrlOrId, setSheetUrlOrId] = useState('');
  const [connectedSheet, setConnectedSheet] = useState<SpreadsheetMetadata | null>(null);
  const [selectedTabName, setSelectedTabName] = useState('');
  const [sheetSearch, setSheetSearch] = useState('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [syncWriteMode, setSyncWriteMode] = useState<'replace' | 'append'>('replace');

  // Confirmation modal state
  const [confirmPayload, setConfirmPayload] = useState<WorkspaceConfirmPayload | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Google Tasks state
  const [taskLists, setTaskLists] = useState<GoogleTaskListItem[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  useEffect(() => {
    setExportSource(initialExportSource);
  }, [initialExportSource]);

  useEffect(() => {
    if (draftTaskInput) {
      setNewTaskTitle(draftTaskInput.title);
      setNewTaskNotes(draftTaskInput.notes);
      onClearDraftTask?.();
    }
  }, [draftTaskInput, onClearDraftTask]);

  useEffect(() => {
    return subscribeWorkspaceToken((tok) => {
      setAccessToken(tok);
    });
  }, []);

  const handleWorkspaceError = (err: unknown) => {
    if (err instanceof WorkspaceApiError && err.status === 401) {
      clearWorkspaceAccessToken();
    }
    setErrorMessage(formatWorkspaceError(err, lang));
  };

  const handleConnectGoogle = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsConnecting(true);
    try {
      const { accessToken: freshToken } = await connectGoogleWorkspace();
      setAccessToken(freshToken);
      setStatusMessage(
        t('تم ربط حساب Google وتفعيل الاتصال المباشر بـ Google Sheets و Google Tasks.', 'Connected to Google Sheets and Google Tasks.')
      );
    } catch (err) {
      handleWorkspaceError(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const getDatasetForKey = (key: SurveyTypeKey) => {
    switch (key) {
      case 'staff-survey':
        return staffSurveys;
      case 'post-visit-log':
        return postVisitLogs;
      case 'mother-survey':
        return motherSurveys;
      case 'drivers-survey':
        return driverSurveys;
      case 'customer-service-survey':
        return csSurveys;
      case 'operations-survey':
        return opsSurveys;
    }
  };

  const buildTabsPayloadForSource = (src: SheetsExportSource) => {
    const isRtl = lang === 'ar';
    if (src === 'all-workbook') {
      const staffSummary = buildStaffKpiSummaryTable(staffSurveys, lang);
      const surveyKeys: SurveyTypeKey[] = [
        'staff-survey',
        'post-visit-log',
        'mother-survey',
        'drivers-survey',
        'customer-service-survey',
        'operations-survey',
      ];
      return [
        {
          title: staffSummary.sheetTitle,
          values: [staffSummary.headers, ...staffSummary.rows],
          rightToLeft: isRtl,
        },
        ...surveyKeys.map((k) => {
          const table = buildSurveySheetTable(k, getDatasetForKey(k), lang);
          return {
            title: table.sheetTitle,
            values: [table.headers, ...table.rows],
            rightToLeft: isRtl,
          };
        }),
      ];
    }

    if (src === 'staff-summary') {
      const summary = buildStaffKpiSummaryTable(staffSurveys, lang);
      return [
        {
          title: summary.sheetTitle,
          values: [summary.headers, ...summary.rows],
          rightToLeft: isRtl,
        },
      ];
    }

    const table = buildSurveySheetTable(src, getDatasetForKey(src), lang);
    return [
      {
        title: table.sheetTitle,
        values: [table.headers, ...table.rows],
        rightToLeft: isRtl,
      },
    ];
  };

  const getSourceLabel = (src: SheetsExportSource): string => {
    switch (src) {
      case 'staff-survey':
        return t(`استبيان الشخصيات (${staffSurveys.length})`, `Character Staff Survey (${staffSurveys.length})`);
      case 'staff-summary':
        return t('ملخص مؤشرات استبيان الشخصيات', 'Character KPI Summary');
      case 'all-workbook':
        return t('ملف شامل (كل الـ 6 استبيانات + الملخص)', 'Complete Workbook (All 6 Surveys + Summary)');
      case 'post-visit-log':
        return t(`مذكرات الزيارة 30ث (${postVisitLogs.length})`, `30s Post-Visit Logs (${postVisitLogs.length})`);
      case 'mother-survey':
        return t(`استبيان الأمهات (${motherSurveys.length})`, `Mothers Survey (${motherSurveys.length})`);
      case 'drivers-survey':
        return t(`استبيان السائقين (${driverSurveys.length})`, `Drivers Survey (${driverSurveys.length})`);
      case 'customer-service-survey':
        return t(`خدمة العملاء (${csSurveys.length})`, `Customer Service (${csSurveys.length})`);
      case 'operations-survey':
        return t(`العمليات والتشغيل (${opsSurveys.length})`, `Operations (${opsSurveys.length})`);
    }
  };

  const handleLoadExistingSheet = async (overrideId?: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const id = overrideId || extractSpreadsheetIdFromInput(sheetUrlOrId);
    if (!id) {
      setErrorMessage(
        t(
          'يرجى لصق رابط Google Sheet صحيح أو إدخال معرف الجدول (Spreadsheet ID).',
          'Please enter a valid Google Sheets URL or Spreadsheet ID.'
        )
      );
      return;
    }

    setIsLoadingSheet(true);
    try {
      const meta = await getSpreadsheetMetadata(id);
      setConnectedSheet(meta);
      const firstTab = meta.sheets[0]?.title || '';
      setSelectedTabName(firstTab);
      if (firstTab) {
        const rows = await readSheetRange(meta.spreadsheetId, firstTab);
        setPreviewRows(rows);
      } else {
        setPreviewRows([]);
      }
      setStatusMessage(
        t(
          `تم فتح الجدول «${meta.title}» وتحميل التبويب «${firstTab}» (${meta.sheets.length} تبويب).`,
          `Loaded "${meta.title}" and previewed tab "${firstTab}" (${meta.sheets.length} tab(s)).`
        )
      );
    } catch (err) {
      handleWorkspaceError(err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleSwitchPreviewTab = async (tabName: string) => {
    setSelectedTabName(tabName);
    if (!connectedSheet || !tabName) return;
    setIsLoadingSheet(true);
    setErrorMessage(null);
    try {
      const rows = await readSheetRange(connectedSheet.spreadsheetId, tabName);
      setPreviewRows(rows);
    } catch (err) {
      handleWorkspaceError(err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const requestCreateSpreadsheet = () => {
    setErrorMessage(null);
    const cleanTitle = newSheetTitle.trim() || 'kidzy kpi,s - Survey Responses';
    const tabs = buildTabsPayloadForSource(exportSource);
    const totalDataRows = tabs.reduce((sum, tab) => sum + Math.max(0, tab.values.length - 1), 0);

    setConfirmPayload({
      title: t('إنشاء جدول Google Sheet جديد وتعبئته', 'Create & Populate New Google Sheet'),
      targetLabel: cleanTitle,
      description: t(
        'سيتم إنشاء ملف Google Sheets جديد في حسابكِ وكتابة الصفوف والأعمدة المصنفة تلقائيًا بداخله.',
        'This will create a new Google Sheets spreadsheet in your Google account and populate it with formatted headers and live survey rows.'
      ),
      affectedDetails: [
        t(`البيانات المختارة: ${getSourceLabel(exportSource)}`, `Source dataset: ${getSourceLabel(exportSource)}`),
        t(
          `عدد التبويبات: ${tabs.length} (${tabs.map((x) => x.title).join('، ')})`,
          `Tabs to create: ${tabs.length} (${tabs.map((x) => x.title).join(', ')})`
        ),
        t(`عدد صفوف الاستجابات المكتوبة: ${totalDataRows}`, `Response rows to write: ${totalDataRows}`),
      ],
      confirmButtonText: t('إنشاء وكتابة البيانات', 'Create & Populate Sheet'),
      tone: 'primary',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const meta = await createKidzySpreadsheet(
            cleanTitle,
            tabs,
            lang === 'en' ? 'en_US' : 'ar_SA'
          );
          setConnectedSheet(meta);
          setSheetUrlOrId(meta.spreadsheetId);
          const firstTab = meta.sheets[0]?.title || '';
          setSelectedTabName(firstTab);
          if (firstTab) {
            const rows = await readSheetRange(meta.spreadsheetId, firstTab);
            setPreviewRows(rows);
          }
          setConfirmPayload(null);
          setStatusMessage(
            t(
              `تم إنشاء «${meta.title}» وحفظ ${totalDataRows} صفًا من البيانات بنجاح.`,
              `Created "${meta.title}" and synced ${totalDataRows} row(s).`
            )
          );
        } catch (err) {
          setConfirmPayload(null);
          handleWorkspaceError(err);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const requestSyncToConnectedSheet = () => {
    if (!connectedSheet) return;
    setErrorMessage(null);

    const tabs = buildTabsPayloadForSource(exportSource);
    const isMultiTab = exportSource === 'all-workbook';
    const isReplace = syncWriteMode === 'replace';

    const totalDataRows = tabs.reduce((sum, tab) => sum + Math.max(0, tab.values.length - 1), 0);
    const singleTargetTab = selectedTabName || tabs[0]?.title || 'Responses';

    setConfirmPayload({
      title: isReplace
        ? t('تأكيد تحديث واستبدال بيانات Google Sheet', 'Confirm Overwrite / Replace Sheet Data')
        : t('تأكيد إضافة صفوف إلى Google Sheet', 'Confirm Append Rows to Google Sheet'),
      targetLabel: isMultiTab
        ? `${connectedSheet.title} (${tabs.length} ${t('تبويبات', 'tabs')})`
        : `${connectedSheet.title} → ${singleTargetTab}`,
      description: isMultiTab
        ? t(
            'سيتم تحديث كل تبويب مطابق (أو إنشاؤه تلقائيًا) واستبدال محتواه بالبيانات المحدثة من قاعدة البيانات.',
            'Each survey tab will be updated (or created if missing) with fresh headers and live Firestore rows, replacing previous cells in those tabs.'
          )
        : isReplace
        ? t(
            `سيتم مسح المحتوى السابق داخل التبويب «${singleTargetTab}» وكتابة العناوين والبيانات الحالية مكانه.`,
            `Existing contents in tab "${singleTargetTab}" will be cleared and replaced with fresh headers and live rows.`
          )
        : t(
            `سيتم إضافة الصفوف الجديدة في نهاية التبويب «${singleTargetTab}» دون مسح الصفوف السابقة.`,
            `Live response rows will be appended to the bottom of tab "${singleTargetTab}".`
          ),
      affectedDetails: [
        t(`الجدول المستهدف: ${connectedSheet.title}`, `Spreadsheet: ${connectedSheet.title}`),
        t(`المصدر: ${getSourceLabel(exportSource)}`, `Source: ${getSourceLabel(exportSource)}`),
        t(`عدد صفوف الاستجابات المتأثرة: ${totalDataRows}`, `Affected response rows: ${totalDataRows}`),
      ],
      confirmButtonText: isReplace
        ? t('تأكيد الاستبدال والمزامنة', 'Confirm Replace & Sync')
        : t('تأكيد إضافة الصفوف', 'Confirm Append Rows'),
      tone: isReplace ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          let latestMeta = connectedSheet;
          if (isMultiTab) {
            for (const tab of tabs) {
              latestMeta = await replaceSheetTabValues(
                connectedSheet.spreadsheetId,
                tab.title,
                tab.values,
                tab.rightToLeft
              );
            }
          } else {
            const singleTab = tabs[0];
            if (isReplace) {
              latestMeta = await replaceSheetTabValues(
                connectedSheet.spreadsheetId,
                singleTargetTab,
                singleTab.values,
                singleTab.rightToLeft
              );
            } else {
              const dataRows = singleTab.values.slice(1);
              if (dataRows.length === 0) {
                throw new Error(
                  t('لا توجد صفوف استجابات لإضافتها في هذا القسم بعد.', 'No response rows to append in this category yet.')
                );
              }
              latestMeta = await appendSheetTabRows(
                connectedSheet.spreadsheetId,
                singleTargetTab,
                dataRows,
                singleTab.values[0] as string[],
                singleTab.rightToLeft
              );
            }
          }

          setConnectedSheet(latestMeta);
          const refreshedTab = isMultiTab ? latestMeta.sheets[0]?.title || '' : singleTargetTab;
          if (refreshedTab) {
            setSelectedTabName(refreshedTab);
            const updatedRows = await readSheetRange(latestMeta.spreadsheetId, refreshedTab);
            setPreviewRows(updatedRows);
          }

          setConfirmPayload(null);
          setStatusMessage(
            t(
              `تمت المزامنة إلى Google Sheets بنجاح (${totalDataRows} صف).`,
              `Successfully synced ${totalDataRows} row(s) to Google Sheets.`
            )
          );
        } catch (err) {
          setConfirmPayload(null);
          handleWorkspaceError(err);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  // ==================== GOOGLE TASKS ====================

  const loadTasksWorkspace = async (overrideListId?: string) => {
    setErrorMessage(null);
    setLoadingTasks(true);
    try {
      const lists = await listGoogleTaskLists();
      setTaskLists(lists);
      const targetId = overrideListId || selectedTaskListId || lists[0]?.id || '';
      setSelectedTaskListId(targetId);
      if (targetId) {
        const items = await listGoogleTasks(targetId);
        setTasks(items);
      } else {
        setTasks([]);
      }
    } catch (err) {
      handleWorkspaceError(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      void loadTasksWorkspace();
    } else {
      setTaskLists([]);
      setTasks([]);
    }
  }, [accessToken]);

  const requestCreateTask = () => {
    if (!selectedTaskListId || !newTaskTitle.trim()) return;
    const listTitle = taskLists.find((l) => l.id === selectedTaskListId)?.title || selectedTaskListId;
    const titleCopy = newTaskTitle.trim();
    const notesCopy = newTaskNotes.trim();

    setConfirmPayload({
      title: t('إضافة مهمة متابعة إلى Google Tasks', 'Create Follow-Up in Google Tasks'),
      targetLabel: listTitle,
      description: t(
        'سيتم إنشاء مهمة جديدة في قائمة Google Tasks المختارة لمتابعة ملاحظات الاستبيان.',
        'This creates a new task in your selected Google Tasks list.'
      ),
      affectedDetails: [
        `${t('عنوان المهمة', 'Task title')}: ${titleCopy}`,
        ...(notesCopy ? [`${t('الملاحظات', 'Notes')}: ${notesCopy}`] : []),
      ],
      confirmButtonText: t('إنشاء المهمة', 'Create Task'),
      tone: 'primary',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await createGoogleTask(selectedTaskListId, { title: titleCopy, notes: notesCopy });
          setNewTaskTitle('');
          setNewTaskNotes('');
          const items = await listGoogleTasks(selectedTaskListId);
          setTasks(items);
          setConfirmPayload(null);
          setStatusMessage(t('تمت إضافة المهمة في Google Tasks بنجاح.', 'Task added to Google Tasks.'));
        } catch (err) {
          setConfirmPayload(null);
          handleWorkspaceError(err);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const requestToggleTask = (task: GoogleTaskItem) => {
    if (!selectedTaskListId) return;
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    setConfirmPayload({
      title: t('تعديل حالة المهمة في Google Tasks', 'Update Task Status'),
      targetLabel: task.title,
      description:
        nextStatus === 'completed'
          ? t('هل تريدين تعليم هذه المهمة كمكتملة في Google Tasks؟', 'Mark this Google Task as completed?')
          : t('هل تريدين إعادة فتح هذه المهمة في Google Tasks؟', 'Reopen this Google Task?'),
      affectedDetails: [task.title],
      confirmButtonText: t('تأكيد التحديث', 'Update Task'),
      tone: 'primary',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await updateGoogleTaskStatus(selectedTaskListId, task.id, nextStatus);
          const items = await listGoogleTasks(selectedTaskListId);
          setTasks(items);
          setConfirmPayload(null);
        } catch (err) {
          setConfirmPayload(null);
          handleWorkspaceError(err);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const requestDeleteTask = (task: GoogleTaskItem) => {
    if (!selectedTaskListId) return;
    setConfirmPayload({
      title: t('حذف مهمة من Google Tasks', 'Delete Google Task'),
      targetLabel: task.title,
      description: t(
        'سيتم حذف هذه المهمة نهائيًا من حساب Google Tasks الخاص بكِ.',
        'This permanently deletes the task from your Google Tasks list.'
      ),
      affectedDetails: [task.title],
      confirmButtonText: t('نعم، احذف المهمة', 'Delete Task'),
      tone: 'danger',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          await deleteGoogleTask(selectedTaskListId, task.id);
          const items = await listGoogleTasks(selectedTaskListId);
          setTasks(items);
          setConfirmPayload(null);
        } catch (err) {
          setConfirmPayload(null);
          handleWorkspaceError(err);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  };

  const previewHeaders = previewRows[0] || [];
  const filteredPreviewBody = previewRows.slice(1).filter((row) => {
    if (!sheetSearch.trim()) return true;
    const q = sheetSearch.toLowerCase();
    return row.some((cell) => cell.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-fade-in" dir={dir}>
      <WorkspaceConfirmModal
        pending={confirmPayload}
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirmPayload(null);
        }}
      />

      {/* Top Google Sheets Connection Banner */}
      <div className="bg-white rounded-3xl border border-[#BAEBF1] p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#007C8D]">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('الربط الحي مع Google Sheets & Google Tasks', 'Live Google Sheets & Tasks Workspace')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#063B44]">
            {t('مزامنة وقراءة جداول بيانات Google Sheets', 'Google Sheets Sync & Explorer')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {t(
              'أنشئي جدول Google Sheets جديدًا بمؤشرات وردود الاستبيانات مباشرة، أو اربطي جدولًا قائمًا لقراءة تبويباته وتحديث صفوفه بأمان بعد التأكيد.',
              'Create a formatted Google Sheets workbook directly from live submissions, or connect an existing spreadsheet to inspect tabs and sync updated survey rows.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!accessToken ? (
            <GoogleSignInButton
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              label={
                isConnecting
                  ? t('جاري الاتصال...', 'Connecting...')
                  : t('Sign in with Google', 'Sign in with Google')
              }
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 bg-[#F7FAFB] border border-[#BAEBF1] px-4 py-2.5 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#063B44] block">
                  {currentUser?.email || t('حساب Google متصل', 'Google Account Connected')}
                </span>
                <span className="text-[11px] text-[#007C8D]">
                  {t('صلاحية Sheets & Tasks مفعلة في الجلسة', 'Sheets & Tasks active in session')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="px-3 py-1.5 bg-white hover:bg-[#BAEBF1]/30 border border-[#BAEBF1] rounded-xl text-[11px] font-bold text-[#063B44] cursor-pointer"
              >
                {t('تبديل الحساب', 'Switch Account')}
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!accessToken ? (
        <div className="bg-white rounded-3xl border border-[#BAEBF1] p-10 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-[#01AFC5]/50" />
          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="text-base font-bold text-[#063B44]">
              {t('سجّلي الدخول بحساب Google للبدء مع Google Sheets', 'Sign in with Google to use Google Sheets')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'لأمان بياناتك، لا يتم حفظ رمز الوصول في المتصفح بعد إغلاق أو تحديث الصفحة. اضغطي على زر Google أعلاه لمنح الإذن والوصول الفوري لجداولك ومهامك.',
                'For security, Workspace access tokens are held strictly in memory for your active session. Sign in above to create, inspect, or update your Google Sheets.'
              )}
            </p>
          </div>
          <div className="pt-1 flex justify-center">
            <GoogleSignInButton onClick={handleConnectGoogle} disabled={isConnecting} />
          </div>
        </div>
      ) : (
        <>
          {/* Source Selector + Create / Connect Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Create New Workbook */}
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Plus className="w-4 h-4 text-[#007C8D]" />
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('1. إنشاء جدول Google Sheet جديد من البيانات الحية', '1. Create New Google Sheet from Live Data')}
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1.5">
                    {t('اختاري البيانات المطلوب تصديرها', 'Dataset to Export / Sync')}
                  </label>
                  <select
                    value={exportSource}
                    onChange={(e) => setExportSource(e.target.value as SheetsExportSource)}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  >
                    <option value="staff-survey">{getSourceLabel('staff-survey')}</option>
                    <option value="staff-summary">{getSourceLabel('staff-summary')}</option>
                    <option value="all-workbook">{getSourceLabel('all-workbook')}</option>
                    <option value="post-visit-log">{getSourceLabel('post-visit-log')}</option>
                    <option value="mother-survey">{getSourceLabel('mother-survey')}</option>
                    <option value="drivers-survey">{getSourceLabel('drivers-survey')}</option>
                    <option value="customer-service-survey">{getSourceLabel('customer-service-survey')}</option>
                    <option value="operations-survey">{getSourceLabel('operations-survey')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1.5">
                    {t('اسم الملف الجديد في Google Sheets', 'New Spreadsheet Title')}
                  </label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                  />
                </div>

                <button
                  type="button"
                  onClick={requestCreateSpreadsheet}
                  className="w-full py-2.5 px-4 bg-[#007C8D] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#FEC448]" />
                  <span>{t('إنشاء Google Sheet جديد الآن', 'Create & Populate New Google Sheet')}</span>
                </button>
              </div>
            </div>

            {/* Column 2: Connect Existing Sheet */}
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FolderOpen className="w-4 h-4 text-[#007C8D]" />
                <h3 className="text-sm font-bold text-[#063B44]">
                  {t('2. فتح وتحديث جدول Google Sheet قائم', '2. Open & Sync Existing Google Sheet')}
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#063B44] mb-1.5">
                    {t('رابط Google Sheets أو معرف الجدول (Spreadsheet ID)', 'Google Sheet URL or Spreadsheet ID')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={sheetUrlOrId}
                      onChange={(e) => setSheetUrlOrId(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#063B44] font-mono focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                    />
                    <button
                      type="button"
                      disabled={isLoadingSheet}
                      onClick={() => void handleLoadExistingSheet()}
                      className="px-4 py-2 bg-[#063B44] hover:bg-[#005866] text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingSheet ? t('جاري التحميل...', 'Loading...') : t('جلب التبويبات', 'Load Sheet')}
                    </button>
                  </div>
                </div>

                {connectedSheet && (
                  <div className="p-4 bg-[#F7FAFB] border border-[#BAEBF1] rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-[#063B44] block">{connectedSheet.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {connectedSheet.sheets.length} {t('تبويبات متاحة', 'tab(s)')}
                        </span>
                      </div>
                      <a
                        href={connectedSheet.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#007C8D] hover:text-[#063B44]"
                      >
                        <span>{t('فتح في Google Sheets', 'Open in Google Sheets')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {t('التبويب المستهدف (Sheet Tab)', 'Target Sheet Tab')}
                        </label>
                        <select
                          value={selectedTabName}
                          onChange={(e) => void handleSwitchPreviewTab(e.target.value)}
                          disabled={exportSource === 'all-workbook'}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#063B44]"
                        >
                          {connectedSheet.sheets.map((s) => (
                            <option key={s.sheetId} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {t('وضع الكتابة', 'Sync Mode')}
                        </label>
                        <select
                          value={syncWriteMode}
                          onChange={(e) => setSyncWriteMode(e.target.value as 'replace' | 'append')}
                          disabled={exportSource === 'all-workbook'}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#063B44]"
                        >
                          <option value="replace">{t('تحديث واستبدال كامل التبويب', 'Replace tab contents')}</option>
                          <option value="append">{t('إضافة الصفوف في النهاية (Append)', 'Append rows to bottom')}</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={requestSyncToConnectedSheet}
                      className="w-full py-2.5 px-4 bg-[#FEC448] hover:bg-[#f5b62f] text-[#063B44] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>
                        {t(
                          `مزامنة «${getSourceLabel(exportSource)}» إلى هذا الجدول`,
                          `Sync ${getSourceLabel(exportSource)} to Sheet`
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Google Sheet Preview Grid */}
          {connectedSheet && (
            <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-[#007C8D]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#063B44]">
                      {t('معاينة البيانات داخل Google Sheet:', 'Sheet Tab Preview:')}{' '}
                      <span className="text-[#007C8D]">{selectedTabName}</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {filteredPreviewBody.length} {t('صف بيانات معروض', 'data row(s)')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search
                      className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                        dir === 'rtl' ? 'right-3' : 'left-3'
                      }`}
                    />
                    <input
                      type="text"
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      placeholder={t('بحث داخل الجدول...', 'Search sheet rows...')}
                      className={`py-1.5 text-xs bg-[#F7FAFB] border border-slate-300 rounded-xl w-44 sm:w-56 ${
                        dir === 'rtl' ? 'pr-8 pl-3' : 'pl-8 pr-3'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingSheet}
                    onClick={() => void handleSwitchPreviewTab(selectedTabName)}
                    className="p-2 bg-[#F7FAFB] hover:bg-[#BAEBF1]/30 border border-[#BAEBF1] rounded-xl text-[#063B44] cursor-pointer"
                    title={t('تحديث المعاينة', 'Refresh')}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {previewRows.length === 0 ? (
                <div className="p-8 bg-[#F7FAFB] rounded-xl text-center text-xs text-slate-500">
                  {t('هذا التبويب فارغ حاليًا. يمكنكِ مزامنة البيانات إليه من النموذج أعلاه.', 'This tab is currently empty. Sync survey rows above to populate it.')}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[420px]">
                  <table className={`w-full text-xs border-collapse ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <thead className="sticky top-0 bg-[#063B44] text-white z-10">
                      <tr>
                        {previewHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 font-bold whitespace-nowrap border border-[#005866]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewBody.slice(0, 60).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#BAEBF1]/15">
                          {previewHeaders.map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className="py-2 px-3 text-[#063B44] border border-slate-100 max-w-[260px] truncate font-mono tabular-nums"
                              title={row[cIdx] || ''}
                            >
                              {row[cIdx] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Google Tasks Follow-Up Panel */}
          <div className="bg-white rounded-2xl border border-[#BAEBF1] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#007C8D]" />
                <div>
                  <h3 className="text-sm font-bold text-[#063B44]">
                    {t('مهام المتابعة عبر Google Tasks', 'Google Tasks Follow-Up Tracker')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('حوّلي ملاحظات موظفات الشخصيات والشكاوى إلى مهام تنفيذية في حساب Google Tasks', 'Track action items from staff survey insights in Google Tasks')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTaskListId}
                  onChange={(e) => void loadTasksWorkspace(e.target.value)}
                  className="bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#063B44]"
                >
                  {taskLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void loadTasksWorkspace(selectedTaskListId)}
                  className="p-2 bg-[#F7FAFB] hover:bg-[#BAEBF1]/30 border border-[#BAEBF1] rounded-xl text-[#063B44] cursor-pointer"
                  title={t('تحديث المهام', 'Refresh Tasks')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t('عنوان مهمة متابعة جديدة (مثال: مراجعة تسعير تمديد 10 دقائق)...', 'New follow-up task title...')}
                className="bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder={t('تفاصيل أو مرجع الملاحظة (اختياري)...', 'Optional notes / context...')}
                  className="flex-1 bg-[#F7FAFB] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#063B44] focus:outline-none focus:ring-2 focus:ring-[#01AFC5]"
                />
                <button
                  type="button"
                  disabled={!newTaskTitle.trim() || !selectedTaskListId}
                  onClick={requestCreateTask}
                  className="px-4 py-2 bg-[#007C8D] hover:bg-[#005866] disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  {t('إضافة مهمة', 'Add Task')}
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                {t('لا توجد مهام في هذه القائمة حاليًا.', 'No tasks in this list yet.')}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-[#BAEBF1]/70 rounded-xl overflow-hidden">
                {tasks.slice(0, 20).map((task) => {
                  const done = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white hover:bg-[#F7FAFB] flex items-center justify-between gap-3 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => requestToggleTask(task)}
                        className="flex items-start gap-2.5 text-start flex-1 cursor-pointer"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            done ? 'text-emerald-600' : 'text-slate-300 hover:text-[#007C8D]'
                          }`}
                        />
                        <div>
                          <span className={`font-bold block ${done ? 'line-through text-slate-400' : 'text-[#063B44]'}`}>
                            {task.title}
                          </span>
                          {task.notes && <span className="text-[11px] text-slate-500 block mt-0.5">{task.notes}</span>}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => requestDeleteTask(task)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer shrink-0"
                        aria-label={t('حذف المهمة', 'Delete task')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
