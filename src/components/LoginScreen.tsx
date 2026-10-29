import React from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  FolderLock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
  onOpenConfig: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  error,
  onOpenConfig,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Sistem Pelaporan Kinerja Terintegrasi Google</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Laporan Kinerja Harian ASN PPPK
          </h1>
          <p className="text-base text-emerald-400 font-semibold mt-1">
            Tenaga Teknis
          </p>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Pencatatan aktivitas harian, templat cerdas, kompresi foto otomatis, serta ekspor resmi dokumen Word (.docx) & HTML.
          </p>
        </div>

        {/* Card Main */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Action Login */}
          <div className="text-center space-y-4">
            <p className="text-xs text-slate-500">
              Masuk dengan akun Google Anda untuk memulai sinkronisasi otomatis ke Google Drive dan Google Sheets pribadi:
            </p>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoading}
                className="gsi-material-button w-full sm:w-auto min-w-[280px] h-12 flex items-center justify-center space-x-3 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm transition-all hover:shadow-md disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                    <span>Menghubungkan ke Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span className="font-semibold text-slate-800">
                      Login dengan Google
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-800">Google Sheets</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  File "Laporan_Kinerja_PPPK" otomatis dibuat di Google Drive Anda.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <FolderLock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-800">Google Drive</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Folder "Lampiran_Laporan_PPPK" otomatis dibuat untuk foto & dokumen.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-800">Aman & Privat</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  100% Client-Side. Data disimpan di akun Google Anda sendiri.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Sesuai standar ASN PPPK Teknis</span>
            </div>
            <button
              onClick={onOpenConfig}
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info Client ID</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          © {new Date().getFullYear()} Laporan Kinerja Harian ASN PPPK Tenaga Teknis • Terintegrasi Google Identity Services
        </p>
      </div>
    </div>
  );
};
