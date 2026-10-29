import React, { useState } from 'react';
import {
  UserCircle,
  FilePlus,
  BookmarkCheck,
  FileText,
  Printer,
  LogOut,
  FileSpreadsheet,
  Folder,
  Settings,
  Menu,
  X,
  Shield,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AuthUser } from '../types';

export type NavTab = 'profil' | 'input' | 'templat' | 'daftar' | 'cetak';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User | AuthUser | null;
  onLogout: () => void;
  onOpenConfig: () => void;
  spreadsheetUrl: string | null;
  folderUrl: string | null;
  onManualRefresh?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  onOpenConfig,
  spreadsheetUrl,
  folderUrl,
  onManualRefresh,
  isSyncing = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profil', label: 'Profil', icon: <UserCircle className="w-4 h-4" /> },
    { id: 'input', label: 'Input Laporan', icon: <FilePlus className="w-4 h-4" /> },
    { id: 'templat', label: 'Kelola Templat Rutin', icon: <BookmarkCheck className="w-4 h-4" /> },
    { id: 'daftar', label: 'Daftar Laporan & Edit', icon: <FileText className="w-4 h-4" /> },
    { id: 'cetak', label: 'Cetak Laporan', icon: <Printer className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-400/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  Laporan Kinerja PPPK
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Tenaga Teknis
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Laporan Kinerja Harian ASN Terintegrasi Google Workspace
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & User Info */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Direct Google Workspace Links */}
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Google Sheet Laporan_Kinerja_PPPK"
                className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] hidden xl:inline">Sheet</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}

            {folderUrl && (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Folder Google Drive Lampiran_Laporan_PPPK"
                className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] hidden xl:inline">Drive</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}

            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isSyncing}
                title="Refresh Data Manual dari Google Sheets"
                className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="text-[11px] hidden xl:inline">Refresh</span>
              </button>
            )}

            <button
              onClick={onOpenConfig}
              title="Konfigurasi Client ID & Integrasi"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {user && (
              <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="max-w-[130px] hidden xl:block">
                  <div className="text-xs font-medium text-slate-200 truncate leading-tight">
                    {user.displayName || 'ASN PPPK'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate leading-tight">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar / Logout"
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isSyncing}
                title="Refresh Data"
                className="p-2 text-slate-300 hover:text-emerald-400 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onOpenConfig}
              title="Konfigurasi"
              className="p-2 text-slate-300 hover:text-white rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium text-white">{user.displayName || 'Pengguna'}</div>
                  <div className="text-[11px] text-slate-400">{user.email}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-950/40 rounded-lg border border-rose-900/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            {onManualRefresh && (
              <button
                type="button"
                onClick={() => {
                  onManualRefresh();
                  setMobileMenuOpen(false);
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-800/60 font-medium transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan Data...' : 'Refresh Data dari Google Sheets'}</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Buka Sheet</span>
                </a>
              )}
              {folderUrl && (
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700"
                >
                  <Folder className="w-4 h-4" />
                  <span>Buka Drive</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
