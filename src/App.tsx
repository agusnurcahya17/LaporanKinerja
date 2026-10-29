/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getStoredSession,
} from './services/firebaseAuth';
import {
  findOrCreateFolder,
  findOrCreateSpreadsheet,
  batchFetchAllDataFromSheets,
  addBatchReportsToSheets,
  addReportToSheets,
  updateReportInSheets,
  deleteReportFromSheets,
  saveProfileToSheets,
  saveTemplatesToSheets,
  uploadFileToDrive,
  DEFAULT_TEMPLATES,
} from './services/googleDriveSheets';
import { UserProfile, ReportItem, RoutineTemplate, AuthUser } from './types';
import { Navbar, NavTab } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { ProfileView } from './components/ProfileView';
import { InputReportView } from './components/InputReportView';
import { RoutineTemplatesView } from './components/RoutineTemplatesView';
import { ReportListView } from './components/ReportListView';
import { PrintReportView } from './components/PrintReportView';
import { ConfigModal } from './components/ConfigModal';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { parseTimeToMinutes } from './utils/dateHelpers';

const LOCAL_STORAGE_PROFILE_KEY = 'pppk_user_profile_v1';
const LOCAL_STORAGE_TEMPLATES_KEY = 'pppk_routine_templates_v1';
const LOCAL_STORAGE_REPORTS_KEY = 'pppk_reports_cache_v1';
const CACHE_SPREADSHEET_ID_KEY = 'pppk_cached_spreadsheet_id';
const CACHE_SPREADSHEET_URL_KEY = 'pppk_cached_spreadsheet_url';
const CACHE_FOLDER_ID_KEY = 'pppk_cached_folder_id';
const CACHE_FOLDER_URL_KEY = 'pppk_cached_folder_url';

export default function App() {
  // Auth state initialized from stored session for instant auto-login
  const initialSession = getStoredSession();
  const [user, setUser] = useState<AuthUser | User | null>(() => {
    return initialSession?.isValid && initialSession.user ? initialSession.user : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return initialSession?.isValid ? initialSession.token : null;
  });
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => {
    return !initialSession?.isValid;
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('input');
  const [inputPreselectedDate, setInputPreselectedDate] = useState<string | null>(null);

  const handleNavigateToInputForDate = (targetDate: string) => {
    setInputPreselectedDate(targetDate);
    setCurrentTab('input');
  };

  // Google Drive & Sheets state - initialized from LocalStorage
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() =>
    localStorage.getItem(CACHE_SPREADSHEET_ID_KEY)
  );
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() =>
    localStorage.getItem(CACHE_SPREADSHEET_URL_KEY)
  );
  const [folderId, setFolderId] = useState<string | null>(() =>
    localStorage.getItem(CACHE_FOLDER_ID_KEY)
  );
  const [folderUrl, setFolderUrl] = useState<string | null>(() =>
    localStorage.getItem(CACHE_FOLDER_URL_KEY)
  );
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);

  // App data state - initialized from LocalStorage
  const [profile, setProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return {
      nama: '',
      nip: '',
      jabatan: 'Tenaga Teknis Operasional',
      unitKerja: '',
      namaAtasan: '',
      nipAtasan: '',
      jabatanAtasan: 'Kepala Sekolah / Pejabat Penilai',
      kota: 'Bandung',
    };
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [templates, setTemplates] = useState<RoutineTemplate[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (cached) {
      try {
        const parsed: RoutineTemplate[] = JSON.parse(cached);
        return parsed.sort(
          (a, b) => parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault)
        );
      } catch {
        // ignore
      }
    }
    return [...DEFAULT_TEMPLATES].sort(
      (a, b) => parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault)
    );
  });

  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [isSavingTemplates, setIsSavingTemplates] = useState<boolean>(false);

  // Toast notification for user feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Modal settings & info
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Cooldown tracker and initialization guards to prevent 429 rate limit
  const lastSyncTimeRef = useRef<number>(0);
  const isInitializingRef = useRef<boolean>(false);
  const hasInitializedWorkspaceRef = useRef<boolean>(false);

  const folderIdRef = useRef<string | null>(folderId);
  folderIdRef.current = folderId;
  const folderUrlRef = useRef<string | null>(folderUrl);
  folderUrlRef.current = folderUrl;
  const spreadsheetIdRef = useRef<string | null>(spreadsheetId);
  spreadsheetIdRef.current = spreadsheetId;
  const spreadsheetUrlRef = useRef<string | null>(spreadsheetUrl);
  spreadsheetUrlRef.current = spreadsheetUrl;

  // Synchronize Google Drive folder & Google Spreadsheet with parallel Promise.all & Stale-While-Revalidate caching
  const initializeWorkspace = useCallback(async (accessToken: string, force = false) => {
    if (isInitializingRef.current) return;
    if (!force && hasInitializedWorkspaceRef.current) return;

    isInitializingRef.current = true;
    setIsSyncingDrive(true);

    // Stale-While-Revalidate: only show blocking loader if no reports in cache yet
    const hasCachedReports = Boolean(localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY));
    if (!hasCachedReports) {
      setIsLoadingReports(true);
    }

    try {
      const activeFolderId = folderIdRef.current;
      const activeFolderUrl = folderUrlRef.current;
      const activeSheetId = spreadsheetIdRef.current;
      const activeSheetUrl = spreadsheetUrlRef.current;

      // PARALLEL REQUESTS (Promise.all):
      // Concurrently verify folder, spreadsheet, and fetch batch sheets in parallel
      const folderPromise = (!activeFolderId || !activeFolderUrl || force)
        ? findOrCreateFolder(accessToken)
        : Promise.resolve({ id: activeFolderId, webViewLink: activeFolderUrl });

      const sheetPromise = (!activeSheetId || !activeSheetUrl || force)
        ? findOrCreateSpreadsheet(accessToken)
        : Promise.resolve({ id: activeSheetId, webViewLink: activeSheetUrl });

      // If spreadsheet ID is already cached, start batch fetch immediately in parallel!
      const batchPromise = (activeSheetId && !force)
        ? batchFetchAllDataFromSheets(accessToken, activeSheetId)
        : sheetPromise.then((s) => batchFetchAllDataFromSheets(accessToken, s.id));

      const [folderRes, sheetRes, batchRes] = await Promise.all([
        folderPromise,
        sheetPromise,
        batchPromise,
      ]);

      if (folderRes && folderRes.id) {
        setFolderId(folderRes.id);
        setFolderUrl(folderRes.webViewLink);
        localStorage.setItem(CACHE_FOLDER_ID_KEY, folderRes.id);
        localStorage.setItem(CACHE_FOLDER_URL_KEY, folderRes.webViewLink);
      }

      if (sheetRes && sheetRes.id) {
        setSpreadsheetId(sheetRes.id);
        setSpreadsheetUrl(sheetRes.webViewLink);
        localStorage.setItem(CACHE_SPREADSHEET_ID_KEY, sheetRes.id);
        localStorage.setItem(CACHE_SPREADSHEET_URL_KEY, sheetRes.webViewLink);
      }

      // Smooth background update with zero freeze
      if (batchRes && !batchRes.rateLimited) {
        if (batchRes.profile && batchRes.profile.nama) {
          setProfile(batchRes.profile);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(batchRes.profile));
        }

        if (batchRes.reports) {
          setReports(batchRes.reports);
          localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(batchRes.reports));
        }

        if (batchRes.templates && batchRes.templates.length > 0) {
          const sortedTemplates = [...batchRes.templates].sort(
            (a, b) => parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault)
          );
          setTemplates(sortedTemplates);
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(sortedTemplates));
        }

        lastSyncTimeRef.current = Date.now();
      } else if (batchRes?.rateLimited) {
        console.warn('Google Sheets API rate limit (429). Menggunakan data cache lokal tanpa gangguan.');
      }

      hasInitializedWorkspaceRef.current = true;
    } catch (err: unknown) {
      console.warn('Info sinkronisasi (menggunakan cache lokal):', err);
    } finally {
      setIsSyncingDrive(false);
      setIsLoadingReports(false);
      isInitializingRef.current = false;
    }
  }, []);

  const initWorkspaceRef = useRef(initializeWorkspace);
  initWorkspaceRef.current = initializeWorkspace;

  // Auth state listener on app startup - runs strictly ONCE on mount
  useEffect(() => {
    // If a valid session already exists in localStorage on startup, trigger initial sync
    const stored = getStoredSession();
    if (stored?.isValid && stored.token && !hasInitializedWorkspaceRef.current) {
      initWorkspaceRef.current(stored.token, false);
    }

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setAuthError(null);
        // Only trigger initial sync once upon authentication
        if (!hasInitializedWorkspaceRef.current) {
          initWorkspaceRef.current(accessToken, false);
        }
      },
      () => {
        const curStored = getStoredSession();
        if (!curStored || !curStored.isValid) {
          setUser(null);
          setToken(null);
          setNeedsAuth(true);
          hasInitializedWorkspaceRef.current = false;
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual Refresh Handler with debounce cooldown to prevent 429
  const handleManualSync = async () => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 6000) {
      showToast('Data sudah mutakhir (baru saja disinkronkan).');
      return;
    }

    let activeToken = token;
    if (!activeToken) {
      activeToken = await getAccessToken();
    }
    if (!activeToken) {
      showToast('Sesi Google kadaluarsa. Silakan login kembali.');
      return;
    }

    showToast('Menyinkronkan data dengan Google Sheets...');
    await initializeWorkspace(activeToken, true);
    showToast('Data berhasil disinkronkan dari Google Sheets!');
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        await initializeWorkspace(result.accessToken, true);
        showToast('Login berhasil! Sesi tersimpan otomatis.');
      }
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal login dengan akun Google';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    hasInitializedWorkspaceRef.current = false;
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    setFolderId(null);
    setFolderUrl(null);
    showToast('Anda telah berhasil keluar dari akun Google.');
  };

  // Profile Save
  const handleSaveProfile = async (newProfile: UserProfile) => {
    setIsSavingProfile(true);
    try {
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      showToast('Profil berhasil disimpan!');

      if (token && spreadsheetId) {
        await saveProfileToSheets(token, spreadsheetId, newProfile);
      }
    } catch (err: unknown) {
      console.error('Save profile error:', err);
      throw err;
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add Single Daily Report
  const handleSubmitReport = async (
    reportData: Omit<ReportItem, 'id' | 'createdAt'>,
    photoFile?: File,
    docFile?: File
  ) => {
    setIsSubmittingReport(true);
    try {
      let activeToken = token || (await getAccessToken());
      let uploadedPhotoUrl = '';
      let uploadedPhotoId = '';
      let uploadedDocUrl = '';
      let uploadedDocId = '';
      let uploadedDocName = '';

      if (photoFile && activeToken && folderId) {
        const photoName = `Foto_${reportData.tanggal}_${Date.now()}.jpg`;
        const photoRes = await uploadFileToDrive(activeToken, folderId, photoFile, photoName);
        uploadedPhotoUrl = photoRes.webViewLink;
        uploadedPhotoId = photoRes.fileId;
      }

      if (docFile && activeToken && folderId) {
        const docName = `Dok_${reportData.tanggal}_${docFile.name}`;
        const docRes = await uploadFileToDrive(activeToken, folderId, docFile, docName);
        uploadedDocUrl = docRes.webViewLink;
        uploadedDocId = docRes.fileId;
        uploadedDocName = docFile.name;
      }

      const newReport: ReportItem = {
        ...reportData,
        id: `rep-${Date.now()}`,
        fotoUrl: uploadedPhotoUrl || undefined,
        fotoId: uploadedPhotoId || undefined,
        docUrl: uploadedDocUrl || undefined,
        docId: uploadedDocId || undefined,
        docName: uploadedDocName || undefined,
        createdAt: new Date().toISOString(),
      };

      // 1. Instantly update local state & cache
      setReports((prev) => {
        const updated = [newReport, ...prev];
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
        return updated;
      });

      showToast('Laporan kegiatan berhasil disimpan!');

      // 2. Append to Sheets in background
      if (activeToken && spreadsheetId) {
        await addReportToSheets(activeToken, spreadsheetId, newReport);
      }
    } catch (err: unknown) {
      console.error('Submit report error:', err);
      throw err;
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Add Multiple Routine Reports (Checklist Sekaligus) in Batch
  const handleSubmitBatchReports = async (
    newItemsData: Omit<ReportItem, 'id' | 'createdAt'>[]
  ) => {
    if (newItemsData.length === 0) return;
    setIsSubmittingReport(true);
    try {
      const timestamp = Date.now();
      const newReports: ReportItem[] = newItemsData.map((item, idx) => ({
        ...item,
        id: `rep-${timestamp}-${idx}`,
        createdAt: new Date().toISOString(),
      }));

      // 1. Instantly update local state & cache
      setReports((prev) => {
        const updated = [...newReports, ...prev];
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
        return updated;
      });

      showToast(`${newReports.length} kegiatan rutin berhasil dicatat!`);

      // 2. Batch append to Google Sheets in background
      let activeToken = token || (await getAccessToken());
      if (activeToken && spreadsheetId) {
        await addBatchReportsToSheets(activeToken, spreadsheetId, newReports);
      }
    } catch (err) {
      console.warn('Batch submit background warning:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Update Daily Report
  const handleUpdateReport = async (
    updatedItem: ReportItem,
    newPhotoFile?: File,
    newDocFile?: File
  ) => {
    let activeToken = token || (await getAccessToken());
    let finalItem = { ...updatedItem };

    if (newPhotoFile && activeToken && folderId) {
      const photoName = `Foto_${finalItem.tanggal}_${Date.now()}.jpg`;
      const photoRes = await uploadFileToDrive(activeToken, folderId, newPhotoFile, photoName);
      finalItem.fotoUrl = photoRes.webViewLink;
      finalItem.fotoId = photoRes.fileId;
    }

    if (newDocFile && activeToken && folderId) {
      const docName = `Dok_${finalItem.tanggal}_${newDocFile.name}`;
      const docRes = await uploadFileToDrive(activeToken, folderId, newDocFile, docName);
      finalItem.docUrl = docRes.webViewLink;
      finalItem.docId = docRes.fileId;
      finalItem.docName = newDocFile.name;
    }

    // 1. Instantly update state & cache
    setReports((prev) => {
      const updated = prev.map((r) => (r.id === finalItem.id ? finalItem : r));
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
      return updated;
    });

    showToast('Perubahan laporan berhasil disimpan!');

    // 2. Update in Google Sheets
    if (activeToken && spreadsheetId) {
      await updateReportInSheets(activeToken, spreadsheetId, finalItem);
    }
  };

  // Delete Daily Report
  const handleDeleteReport = async (reportId: string) => {
    // 1. Instantly update state & cache
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== reportId);
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
      return updated;
    });

    showToast('Laporan berhasil dihapus.');

    // 2. Delete from Google Sheets in background
    let activeToken = token || (await getAccessToken());
    if (activeToken && spreadsheetId) {
      await deleteReportFromSheets(activeToken, spreadsheetId, reportId);
    }
  };

  // Save Routine Templates (ensuring morning to afternoon sorting)
  const handleSaveTemplates = async (updatedTemplates: RoutineTemplate[]) => {
    setIsSavingTemplates(true);
    const sorted = [...updatedTemplates].sort(
      (a, b) => parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault)
    );
    try {
      setTemplates(sorted);
      localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(sorted));
      showToast('Templat berhasil disimpan!');

      if (token && spreadsheetId) {
        await saveTemplatesToSheets(token, spreadsheetId, sorted);
      }
    } catch (err: unknown) {
      console.error('Save templates error:', err);
      throw err;
    } finally {
      setIsSavingTemplates(false);
    }
  };

  // If user is not authenticated or needs login
  if (needsAuth || !user) {
    return (
      <>
        <LoginScreen
          onLogin={handleGoogleLogin}
          isLoading={isLoggingIn}
          error={authError}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          spreadsheetUrl={spreadsheetUrl}
          folderUrl={folderUrl}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== 'input') {
            setInputPreselectedDate(null);
          }
          setCurrentTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        onOpenConfig={() => setIsConfigOpen(true)}
        spreadsheetUrl={spreadsheetUrl}
        folderUrl={folderUrl}
        onManualRefresh={handleManualSync}
        isSyncing={isSyncingDrive}
      />

      {/* Non-intrusive Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'profil' && (
          <ProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            isSaving={isSavingProfile}
            spreadsheetUrl={spreadsheetUrl}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'input' && (
          <InputReportView
            templates={templates}
            onSubmitReport={handleSubmitReport}
            onSubmitBatchReports={handleSubmitBatchReports}
            isSubmitting={isSubmittingReport}
            onNavigateToTemplates={() => setCurrentTab('templat')}
            initialDate={inputPreselectedDate}
            onClearInitialDate={() => setInputPreselectedDate(null)}
          />
        )}

        {currentTab === 'templat' && (
          <RoutineTemplatesView
            templates={templates}
            onSaveTemplates={handleSaveTemplates}
            isSaving={isSavingTemplates}
          />
        )}

        {currentTab === 'daftar' && (
          <ReportListView
            reports={reports}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
            isLoading={isLoadingReports}
            onNavigateToInput={() => {
              setInputPreselectedDate(null);
              setCurrentTab('input');
            }}
            onNavigateToInputWithDate={handleNavigateToInputForDate}
          />
        )}

        {currentTab === 'cetak' && (
          <PrintReportView profile={profile} reports={reports} />
        )}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Aplikasi Laporan Kinerja Harian ASN PPPK Tenaga Teknis
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-600 flex items-center space-x-1"
              >
                <span>Google Sheet Aktif</span>
              </a>
            )}
            <button
              onClick={handleManualSync}
              disabled={isSyncingDrive}
              className="hover:text-emerald-600 flex items-center space-x-1 underline cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span>Sinkronisasi Manual</span>
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="hover:text-slate-700 underline"
            >
              Info Client ID & API Key
            </button>
          </div>
        </div>
      </footer>

      {/* Configuration & GIS Credentials Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        spreadsheetUrl={spreadsheetUrl}
        folderUrl={folderUrl}
      />
    </div>
  );
}
