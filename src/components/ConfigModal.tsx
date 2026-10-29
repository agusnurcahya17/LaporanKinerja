import React, { useState } from 'react';
import { X, Key, Copy, Check, FileSpreadsheet, Folder, ShieldCheck } from 'lucide-react';
import { getOAuthConfig } from '../services/firebaseAuth';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetUrl: string | null;
  folderUrl: string | null;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  spreadsheetUrl,
  folderUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const config = getOAuthConfig();

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Konfigurasi Google Identity & Integrasi
              </h3>
              <p className="text-xs text-slate-500">
                Informasi Client ID, API Key, serta Dokumen Google Terhubung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <strong className="font-semibold">Otentikasi Client-Side Aktif:</strong> Aplikasi terhubung langsung menggunakan token aman di memori browser dengan scope Google Drive File dan Google Sheets. Data Anda tersimpan langsung pada akun Google Drive pribadi Anda.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  OAuth Client ID (Google Identity Services)
                </label>
                {config.clientId && (
                  <button
                    onClick={() => copyToClipboard(config.clientId, 'clientId')}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {copiedKey === 'clientId' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Client ID</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 break-all select-all">
                {config.clientId || 'Sedang memuat atau tidak ditentukan'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Konfigurasi disimpan di <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">firebase-applet-config.json</code>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  API Key
                </label>
                {config.apiKey && (
                  <button
                    onClick={() => copyToClipboard(config.apiKey, 'apiKey')}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {copiedKey === 'apiKey' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin API Key</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 break-all select-all">
                {config.apiKey || 'Sedang memuat atau tidak ditentukan'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Penyimpanan Google Akun Anda
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {spreadsheetUrl ? (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center space-x-2 text-emerald-800 text-xs font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Buka "Laporan_Kinerja_PPPK"</span>
                </a>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Sheet belum dibuat</span>
                </div>
              )}

              {folderUrl ? (
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center space-x-2 text-amber-800 text-xs font-medium"
                >
                  <Folder className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">Buka "Lampiran_Laporan_PPPK"</span>
                </a>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center space-x-2">
                  <Folder className="w-4 h-4 shrink-0" />
                  <span>Folder belum dibuat</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
