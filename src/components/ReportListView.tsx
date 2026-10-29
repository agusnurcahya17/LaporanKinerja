import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Camera,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Save,
  Upload,
  Eye,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Plus,
  Maximize2,
  ChevronsUpDown,
} from 'lucide-react';
import { ReportItem } from '../types';
import {
  formatDisplayDate,
  toInputTimeFormat,
  normalizeTimeFormat,
  NAMA_BULAN_INDONESIA,
  getTodayDateString,
  parseTimeToMinutes,
} from '../utils/dateHelpers';
import { ConfirmModal } from './ConfirmModal';
import {
  compressImageUnder300KB,
  CompressionResult,
} from '../utils/imageCompressor';

interface DateGroup {
  tanggal: string;
  displayDate: string;
  isToday: boolean;
  items: ReportItem[];
}

interface ReportListViewProps {
  reports: ReportItem[];
  onUpdateReport: (
    updated: ReportItem,
    newPhotoFile?: File,
    newDocFile?: File
  ) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  isLoading: boolean;
  onNavigateToInput: () => void;
  onNavigateToInputWithDate?: (targetDate: string) => void;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  reports,
  onUpdateReport,
  onDeleteReport,
  isLoading,
  onNavigateToInput,
  onNavigateToInputWithDate,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const todayDateStr = getTodayDateString();

  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination / Limit for date groups rendered to prevent DOM bloat (Max 10-15 date groups initially)
  const [visibleGroupsLimit, setVisibleGroupsLimit] = useState<number>(10);

  // Accordion state: set of expanded dates
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Edit states
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [editFormData, setEditFormData] = useState<ReportItem | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editDocFile, setEditDocFile] = useState<File | null>(null);
  const [isCompressingEdit, setIsCompressingEdit] = useState<boolean>(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Delete candidate
  const [deleteCandidate, setDeleteCandidate] = useState<ReportItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Lightbox / Image preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Group reports by date (descending newest to oldest), sorted morning to afternoon inside each group
  const dateGroups: DateGroup[] = useMemo(() => {
    // 1. Filter reports first
    const filtered = reports.filter((r) => {
      if (!r.tanggal) return false;
      const [year, month] = r.tanggal.split('-');

      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (selectedMonth !== 'all' && Number(month) !== Number(selectedMonth)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUraian = r.uraian?.toLowerCase().includes(q);
        const matchOutput = r.output?.toLowerCase().includes(q);
        const matchTanggal = r.tanggal?.includes(q);
        if (!matchUraian && !matchOutput && !matchTanggal) return false;
      }

      return true;
    });

    // 2. Group by date map
    const groupMap = new Map<string, ReportItem[]>();
    for (const item of filtered) {
      const d = item.tanggal;
      if (!groupMap.has(d)) {
        groupMap.set(d, []);
      }
      groupMap.get(d)!.push(item);
    }

    // 3. Build array sorted descending by date (newest first)
    const sortedDates = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((d) => {
      // Sort items inside each day chronologically from morning to afternoon
      const items = groupMap.get(d)!.sort((a, b) => {
        return parseTimeToMinutes(a.jamMulai) - parseTimeToMinutes(b.jamMulai);
      });

      return {
        tanggal: d,
        displayDate: formatDisplayDate(d),
        isToday: d === todayDateStr,
        items,
      };
    });
  }, [reports, selectedMonth, selectedYear, searchQuery, todayDateStr]);

  // Total filtered reports count
  const totalFilteredReportsCount = useMemo(() => {
    return dateGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [dateGroups]);

  // Auto-expand newest or today's date group by default whenever filter changes
  useEffect(() => {
    if (dateGroups.length > 0) {
      // Find today or newest date
      const todayGroup = dateGroups.find((g) => g.isToday);
      const defaultDate = todayGroup ? todayGroup.tanggal : dateGroups[0].tanggal;
      setExpandedDates(new Set([defaultDate]));
    } else {
      setExpandedDates(new Set());
    }
  }, [selectedMonth, selectedYear, dateGroups.length]);

  // Toggle single date group accordion
  const handleToggleDate = (tanggal: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(tanggal)) {
        next.delete(tanggal);
      } else {
        next.add(tanggal);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const handleExpandAll = () => {
    setExpandedDates(new Set(dateGroups.map((g) => g.tanggal)));
  };

  const handleCollapseAll = () => {
    setExpandedDates(new Set());
  };

  // Handle edit modal open
  const handleOpenEdit = (item: ReportItem) => {
    setEditingReport(item);
    setEditFormData({ ...item });
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setEditDocFile(null);
  };

  const handleEditPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa format gambar (JPG, PNG, JPEG, WEBP)');
      return;
    }

    setIsCompressingEdit(true);
    try {
      const res = await compressImageUnder300KB(file);
      setEditPhotoFile(res.file);
      setEditPhotoPreview(res.previewUrl);
    } catch {
      alert('Gagal memproses dan mengompresi gambar');
    } finally {
      setIsCompressingEdit(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setIsSubmittingEdit(true);
    try {
      await onUpdateReport(
        {
          ...editFormData,
          jamMulai: normalizeTimeFormat(editFormData.jamMulai),
        },
        editPhotoFile || undefined,
        editDocFile || undefined
      );
      setEditingReport(null);
      setEditFormData(null);
    } catch {
      // Handled in parent
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await onDeleteReport(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch {
      // Handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  // Visible groups with pagination limit
  const visibleGroups = dateGroups.slice(0, visibleGroupsLimit);
  const hasMoreGroups = dateGroups.length > visibleGroupsLimit;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Summary */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Riwayat & Kelola Laporan Kinerja Harian
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dikelompokkan rapi per tanggal kegiatan dengan urutan terbaru dan fitur accordion interaktif.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onNavigateToInput}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Laporan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setVisibleGroupsLimit(10);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-slate-700"
            >
              <option value="all">Semua Bulan</option>
              {NAMA_BULAN_INDONESIA.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setVisibleGroupsLimit(10);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-slate-700"
            >
              <option value="all">Semua Tahun</option>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pencarian Uraian / Output / Tanggal
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleGroupsLimit(10);
                }}
                placeholder="Cari uraian kegiatan, gerbang, sapu, toilet, tanggal..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Toolbar Footer: Summary & Accordion Global Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{dateGroups.length}</span> hari kerja (
            <span className="font-bold text-slate-800">{totalFilteredReportsCount}</span> aktivitas kegiatan)
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
            >
              Buka Semua
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* Main List Grouped by Date */}
      {isLoading && reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Memuat data laporan dari Google Sheets...</p>
        </div>
      ) : dateGroups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 py-16 text-center text-slate-400">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Belum ada laporan pada filter ini</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Silakan pilih bulan atau tahun lain, atau klik tombol Input Laporan Baru di atas untuk mencatat kegiatan.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {visibleGroups.map((group) => {
            const isExpanded = expandedDates.has(group.tanggal);

            return (
              <div
                key={group.tanggal}
                className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                {/* Date Group Card Header */}
                <div
                  onClick={() => handleToggleDate(group.tanggal)}
                  className={`px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    isExpanded ? 'bg-slate-50/90 border-b border-slate-200' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Left: Date title & Badges */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      aria-label="Toggle accordion"
                      className="text-slate-400 hover:text-emerald-700 transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-sm text-slate-800">
                        {group.displayDate}
                      </span>
                    </div>

                    {group.isToday && (
                      <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Hari Ini
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                      {group.items.length} Aktivitas
                    </span>
                  </div>

                  {/* Right: Quick Add Button for this specific date */}
                  <div
                    className="flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToInputWithDate) {
                          onNavigateToInputWithDate(group.tanggal);
                        } else {
                          onNavigateToInput();
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                      title={`Tambah kegiatan baru pada tanggal ${group.displayDate}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah di Tanggal Ini</span>
                    </button>
                  </div>
                </div>

                {/* Date Group Body: Sub-Table of Activities */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-100">
                          <th className="py-2.5 px-3.5 text-center w-12">No</th>
                          <th className="py-2.5 px-3 text-center w-24">Jam Mulai</th>
                          <th className="py-2.5 px-4">Uraian Kegiatan / Pekerjaan</th>
                          <th className="py-2.5 px-3.5 w-44">Hasil / Output</th>
                          <th className="py-2.5 px-3 text-center w-28">Lampiran</th>
                          <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((item, index) => {
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 transition-colors group"
                            >
                              <td className="py-2.5 px-3.5 text-center font-medium text-slate-400">
                                {index + 1}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-700">
                                <span className="bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
                                  {item.jamMulai || '-'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                                  {item.uraian}
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium text-[11px] border border-slate-200">
                                  {item.output}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  {item.fotoUrl ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImage({
                                          url: item.fotoUrl!,
                                          title: item.uraian,
                                        })
                                      }
                                      title="Lihat Foto Lampiran"
                                      className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md transition border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-semibold">Foto</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-slate-300">-</span>
                                  )}

                                  {item.docUrl && (
                                    <a
                                      href={item.docUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Buka Dokumen di Google Drive"
                                      className="p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition border border-blue-200 flex items-center gap-1"
                                    >
                                      <FileCheck className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-semibold">Dok</span>
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item)}
                                    title="Edit Aktivitas Ini"
                                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteCandidate(item)}
                                    title="Hapus Aktivitas Ini"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination / Load More Button */}
          {hasMoreGroups && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleGroupsLimit((prev) => prev + 10)}
                className="px-5 py-2.5 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs transition cursor-pointer"
              >
                Muat Lebih Banyak Tanggal (Menampilkan {visibleGroups.length} dari {dateGroups.length} hari)
              </button>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingReport && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Edit Aktivitas Kinerja</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.tanggal}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, tanggal: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai (Hanya Jam Mulai) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={toInputTimeFormat(editFormData.jamMulai)}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, jamMulai: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Kegiatan / Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.uraian}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, uraian: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden leading-relaxed text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hasil / Output
                </label>
                <input
                  type="text"
                  value={editFormData.output}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, output: e.target.value })
                  }
                  placeholder="Contoh: 1 Kegiatan / Area Halaman Bersih"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800"
                />
              </div>

              {/* Foto Attachment Section with automatic compression */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Lampiran Foto Dokumentasi</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Kompresi otomatis &lt; 300 KB
                  </span>
                </div>

                {/* Current photo preview or new photo preview */}
                {(editPhotoPreview || editFormData.fotoUrl) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={editPhotoPreview || editFormData.fotoUrl}
                        alt="Preview Foto"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div className="text-xs flex-1 min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {editPhotoFile ? editPhotoFile.name : 'Foto Tersimpan di Google Drive'}
                        </span>
                        {editPhotoFile ? (
                          <div className="mt-1 flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Foto siap diunggah: {(editPhotoFile.size / 1024).toFixed(1)} KB (&lt; 300 KB)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Foto saat ini dari Google Drive. Pilih tombol di bawah jika ingin mengganti.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Native photo chooser (Camera & Gallery supported via standard accept="image/*" without capture attr) */}
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-3 flex items-center justify-center space-x-3 cursor-pointer transition text-center group active:scale-[0.99]">
                  <div className="flex items-center space-x-1.5 text-slate-500 group-hover:text-emerald-700 shrink-0">
                    <div className="p-1.5 rounded-md bg-white border border-slate-200 shadow-2xs group-hover:border-emerald-300">
                      <Camera className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-slate-300">/</span>
                    <div className="p-1.5 rounded-md bg-white border border-slate-200 shadow-2xs group-hover:border-emerald-300">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                      {editPhotoPreview || editFormData.fotoUrl
                        ? 'Ganti Foto (Kamera atau Galeri HP)'
                        : 'Pilih / Ambil Foto (Kamera atau Galeri HP)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Format JPG, PNG, WEBP • Otomatis dikompresi &lt; 300 KB
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoSelect}
                    className="hidden"
                  />
                </label>

                {isCompressingEdit && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center space-x-2 text-xs text-emerald-800 font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>Mengompresi gambar via Canvas (&lt; 300 KB)...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || isCompressingEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmittingEdit ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 truncate pr-2">
                Foto Dokumentasi Kegiatan
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt="Foto Dokumentasi"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-sm"
              />
            </div>
            <div className="p-3 bg-white flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-slate-600 line-clamp-1">{previewImage.title}</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Buka di Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Hapus Aktivitas Laporan"
        message={`Apakah Anda yakin ingin menghapus kegiatan "${deleteCandidate?.uraian}" pada tanggal ${formatDisplayDate(
          deleteCandidate?.tanggal || ''
        )}? Data akan dihapus dari Google Sheets Anda.`}
        confirmLabel={isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
