import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileDown,
  Calendar,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserProfile, ReportItem } from '../types';
import {
  NAMA_BULAN_INDONESIA,
  getTodayDateString,
  formatDisplayDate,
  formatTanggalIndonesia,
  formatTanggalRingkas,
} from '../utils/dateHelpers';
import {
  generateHtmlReportString,
  openHtmlReportInNewTab,
  getDriveImageThumbnailUrl,
  getDriveThumbnailFallbackUrl,
} from '../utils/htmlReportGenerator';

interface PrintReportViewProps {
  profile: UserProfile;
  reports: ReportItem[];
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  profile,
  reports,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const today = getTodayDateString();

  // Mode Rentang Cetak: 'bulanan' | 'harian'
  const [printMode, setPrintMode] = useState<'bulanan' | 'harian'>('bulanan');

  // Filter Bulanan
  const [bulan, setBulan] = useState<number>(currentMonth);
  const [tahun, setTahun] = useState<number>(currentYear);

  // Filter Harian
  const [tanggalHarian, setTanggalHarian] = useState<string>(today);

  // Common print options
  const [tanggalCetak, setTanggalCetak] = useState<string>(today);
  const [tempatKota, setTempatKota] = useState<string>(profile.kota || 'Bandung');
  const [showPhotosInHtml, setShowPhotosInHtml] = useState<boolean>(true);

  // Action states
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // Modal Fullscreen Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Filtered reports according to mode
  const activeReports = useMemo(() => {
    if (printMode === 'harian') {
      return reports
        .filter((r) => r.tanggal === tanggalHarian)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    }

    // Bulanan
    return reports
      .filter((r) => {
        if (!r.tanggal) return false;
        const [y, m] = r.tanggal.split('-').map(Number);
        return y === tahun && m === bulan;
      })
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return a.jamMulai.localeCompare(b.jamMulai);
      });
  }, [reports, printMode, tanggalHarian, bulan, tahun]);

  const namaBulan = NAMA_BULAN_INDONESIA[bulan - 1] || '';
  const tanggalCetakFormatted = formatTanggalRingkas(tanggalCetak);

  // Photos attached in active reports
  const reportsWithPhotos = useMemo(() => {
    return activeReports.filter((r) => Boolean(r.fotoUrl));
  }, [activeReports]);

  // Group active reports by date for grouped daily tables
  const groupedActiveReports = useMemo(() => {
    const map = new Map<string, ReportItem[]>();
    activeReports.forEach((item) => {
      const d = item.tanggal || '';
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(item);
    });
    return map;
  }, [activeReports]);

  // Handle Export Word (.docx) - Pure table, no photos (dynamic code-split import)
  const handleExportWord = async () => {
    setIsExportingDocx(true);
    try {
      const { exportLaporanToDocx } = await import('../utils/docxExport');
      await exportLaporanToDocx({
        mode: printMode,
        profile: { ...profile, kota: tempatKota },
        reports: activeReports,
        bulan,
        tahun,
        tanggalHarian,
        tanggalCetak,
      });

      const modeLabel = printMode === 'harian' ? 'Harian' : 'Bulanan';
      setNotification({
        type: 'success',
        text: `Dokumen Word (.docx) ${modeLabel} berhasil dibuat dan diunduh (murni tabel kinerja tanpa foto).`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert('Gagal mengekspor file Word');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Generate full HTML content string
  const currentHtmlContent = useMemo(() => {
    return generateHtmlReportString({
      mode: printMode,
      profile: { ...profile, kota: tempatKota },
      reports: activeReports,
      bulan,
      tahun,
      tanggalHarian,
      tanggalCetak,
      includePhotos: showPhotosInHtml,
    });
  }, [
    printMode,
    profile,
    tempatKota,
    activeReports,
    bulan,
    tahun,
    tanggalHarian,
    tanggalCetak,
    showPhotosInHtml,
  ]);

  // Handle View / Print HTML
  const handleViewHtml = () => {
    // Attempt to open in a new tab first
    const opened = openHtmlReportInNewTab(currentHtmlContent);

    if (opened) {
      setNotification({
        type: 'info',
        text: 'Jendela baru preview HTML dibuka. Gunakan tombol "Cetak / Simpan PDF" di bagian atas halaman tersebut.',
      });
      setTimeout(() => setNotification(null), 6000);
    } else {
      // If popup was blocked by browser or restricted in iframe, open modal preview seamlessly
      setIsPreviewModalOpen(true);
      setNotification({
        type: 'info',
        text: 'Preview dokumen ditampilkan di layar. Anda dapat langsung mencetak atau menyimpan ke PDF.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Control Panel (Hidden on Print) */}
      <div className="no-print bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Review & Cetak Laporan Kinerja Resmi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dukungan rekapitulasi Bulanan atau Lembar Pengesahan Harian untuk Word (.docx) dan HTML.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Ekspor Word (.docx) */}
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingDocx}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {isExportingDocx ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membuat Word...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Cetak / Ekspor Word (.docx)</span>
                </>
              )}
            </button>

            {/* 2. Cetak / View HTML (New Tab / Modal with Window.Print) */}
            <button
              type="button"
              onClick={handleViewHtml}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Cetak / View HTML</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification.text}</span>
          </div>
        )}

        {/* Pilihan Mode Rentang Cetak: Harian vs Bulanan */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Pilih Rentang Cetak Laporan
            </label>
            <div className="grid grid-cols-2 max-w-md gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPrintMode('bulanan')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
                  printMode === 'bulanan'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mode Bulanan (Rekap 1 Bulan)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('harian')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 ${
                  printMode === 'harian'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mode Harian (Pengesahan 1 Hari)</span>
              </button>
            </div>
          </div>

          {/* Conditional Filters based on Print Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {printMode === 'bulanan' ? (
              <>
                {/* Pilih Bulan */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Bulan Laporan
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  >
                    {NAMA_BULAN_INDONESIA.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Tahun */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Tahun
                  </label>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Pilih Tanggal Spesifik Harian */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Tanggal Spesifik Kinerja Harian
                    </label>
                    <button
                      type="button"
                      onClick={() => setTanggalHarian(today)}
                      className="text-[10px] text-emerald-600 hover:underline font-semibold"
                    >
                      Hari Ini
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalHarian}
                      onChange={(e) => setTanggalHarian(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 font-mono"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    {formatTanggalIndonesia(tanggalHarian)}
                  </p>
                </div>
              </>
            )}

            {/* Tempat / Kota Dokumen */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tempat / Kota Dokumen
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempatKota}
                  onChange={(e) => setTempatKota(e.target.value)}
                  placeholder="Contoh: Bandung / Cianjur"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Tanggal Cetak */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tanggal Dokumen Cetak
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggalCetak}
                  onChange={(e) => setTanggalCetak(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Note on Word vs HTML */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-800">Status Data:</span>
            <span>
              Ditemukan <strong>{activeReports.length} kegiatan</strong> pada periode ini.
            </span>
            <span>• Word (.docx): <strong>Murni tabel kinerja</strong> (tanpa foto).</span>
            <span>• HTML: <strong>Lengkap dengan thumbnail foto di kolom kanan</strong>.</span>
          </div>
        </div>
      </div>

      {/* OFFICIAL GOVERNMENT DOCUMENT SHEET (Live In-App Paper Preview) */}
      <div className="print-sheet bg-white rounded-xl shadow-lg border border-slate-200 p-8 sm:p-12 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
        {/* KOP LAPORAN RESMI */}
        <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900">
            LAPORAN KINERJA HARIAN PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA (PPPK)
          </h1>
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
            {printMode === 'harian'
              ? 'LEMBAR PENGESAHAN KINERJA HARIAN - TENAGA TEKNIS'
              : 'TENAGA TEKNIS'}
          </h2>
          <p className="text-xs sm:text-sm font-semibold uppercase text-slate-700">
            {printMode === 'harian'
              ? `HARI / TANGGAL: ${formatTanggalIndonesia(tanggalHarian).toUpperCase()}`
              : `PERIODE: BULAN ${namaBulan.toUpperCase()} TAHUN ${tahun}`}
          </p>
        </div>

        {/* IDENTITAS PEGAWAI & ATASAN */}
        <div className="mt-6 text-xs sm:text-sm space-y-1 text-slate-800">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-44 py-1 font-semibold text-slate-700">Nama Pegawai</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1 font-bold">{profile.nama || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-slate-700">NIP PPPK</td>
                <td className="py-1">:</td>
                <td className="py-1 font-mono">{profile.nip || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-slate-700">Jabatan</td>
                <td className="py-1">:</td>
                <td className="py-1">{profile.jabatan || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-slate-700">Unit Kerja / Instansi</td>
                <td className="py-1">:</td>
                <td className="py-1">{profile.unitKerja || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-slate-700">Atasan Langsung</td>
                <td className="py-1">:</td>
                <td className="py-1">
                  {profile.namaAtasan || '-'} ({profile.jabatanAtasan || 'Atasan'})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABEL KEGIATAN KINERJA DIKELOMPOKKAN PER HARI/TANGGAL */}
        <div className="mt-6 space-y-6">
          {groupedActiveReports.size === 0 ? (
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-1.5">
                Hari/tanggal : -
              </div>
              <table className="w-full border-collapse text-xs border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center border-b border-slate-900 text-slate-800">
                    <th className="border-r border-slate-900 py-2.5 px-2 w-10">No</th>
                    <th className="border-r border-slate-900 py-2.5 px-2 w-20">Jam Mulai</th>
                    <th className="border-r border-slate-900 py-2.5 px-3">Uraian Kegiatan / Pekerjaan</th>
                    <th className="border-r border-slate-900 py-2.5 px-3 w-32">Hasil / Output</th>
                    <th className="py-2.5 px-2 w-28">Dokumentasi / Foto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      {printMode === 'harian'
                        ? `Belum ada data kegiatan pada tanggal ${formatTanggalIndonesia(tanggalHarian)}.`
                        : `Belum ada data laporan kinerja pada bulan ${namaBulan} ${tahun}.`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            Array.from(groupedActiveReports.entries()).map(([dateKey, dayItems]) => (
              <div key={dateKey} className="day-table-group">
                <div className="text-xs font-semibold text-slate-900 mb-1.5">
                  Hari/tanggal : {formatTanggalIndonesia(dateKey)}
                </div>
                <table className="w-full border-collapse text-xs border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center border-b border-slate-900 text-slate-800">
                      <th className="border-r border-slate-900 py-2.5 px-2 w-10">No</th>
                      <th className="border-r border-slate-900 py-2.5 px-2 w-20">Jam Mulai</th>
                      <th className="border-r border-slate-900 py-2.5 px-3 text-left">Uraian Kegiatan / Pekerjaan</th>
                      <th className="border-r border-slate-900 py-2.5 px-3 w-32">Hasil / Output</th>
                      <th className="py-2.5 px-2 w-28">Dokumentasi / Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-900/60 align-top hover:bg-slate-50/50"
                      >
                        <td className="border-r border-slate-900/60 py-2 px-2 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="border-r border-slate-900/60 py-2 px-2 text-center font-mono font-semibold text-emerald-700">
                          {item.jamMulai || '-'}
                        </td>
                        <td className="border-r border-slate-900/60 py-2 px-3 leading-relaxed whitespace-pre-wrap">
                          {item.uraian}
                        </td>
                        <td className="border-r border-slate-900/60 py-2 px-3">{item.output}</td>
                        <td className="py-2 px-2 text-center align-middle">
                          {item.fotoUrl || item.fotoId ? (
                            <a
                              href={item.fotoUrl || `https://drive.google.com/file/d/${item.fotoId}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block group"
                              title="Klik untuk membuka foto asli di Google Drive"
                            >
                              <img
                                src={getDriveImageThumbnailUrl(item.fotoUrl, item.fotoId)}
                                alt={`Dokumentasi #${index + 1}`}
                                className="w-20 h-14 object-cover rounded-sm border border-slate-400 mx-auto group-hover:opacity-80 transition bg-slate-100"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.retried) {
                                    target.dataset.retried = 'true';
                                    target.src = getDriveThumbnailFallbackUrl(item.fotoUrl, item.fotoId);
                                  }
                                }}
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* LEMBAR TANDA TANGAN DUA KOLOM */}
        <div className="mt-10 pt-4 grid grid-cols-2 text-xs sm:text-sm text-slate-900 avoid-break">
          {/* Kolom Kiri: Atasan Langsung */}
          <div className="text-left space-y-1">
            <p>Mengetahui,</p>
            <p className="font-bold">{profile.jabatanAtasan || 'Atasan Langsung'}</p>
            {/* Signature blank space */}
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">
              {profile.namaAtasan ? `(${profile.namaAtasan})` : '(............................................)'}
            </p>
            <p className="font-mono text-xs">
              NIP. {profile.nipAtasan || '.....................................'}
            </p>
          </div>

          {/* Kolom Kanan: Pegawai PPPK */}
          <div className="text-left pl-6 space-y-1">
            <p>
              {tempatKota || 'Tempat'}, {tanggalCetakFormatted}
            </p>
            <p className="font-bold">Pegawai Yang Bersangkutan (PPPK)</p>
            {/* Signature blank space */}
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">
              {profile.nama ? `(${profile.nama})` : '(............................................)'}
            </p>
            <p className="font-mono text-xs">
              NIP. {profile.nip || '.....................................'}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL FULLSCREEN PREVIEW DENGAN TOMBOL "CETAK / SIMPAN PDF" */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          {/* Top Sticky Bar in Modal */}
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
            <div className="flex items-center space-x-3">
              <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Pratinjau Dokumen HTML ({printMode === 'harian' ? 'Mode Harian' : 'Mode Bulanan'})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Format resmi siap cetak / simpan ke PDF lengkap dengan foto lampiran
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => openHtmlReportInNewTab(currentHtmlContent)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center space-x-1 transition"
                title="Buka tab baru terpisah"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tab Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Document Sheet inside Modal */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200">
            <div
              className="bg-white max-w-4xl w-full p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-300 text-slate-900"
              dangerouslySetInnerHTML={{
                __html: currentHtmlContent
                  .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '')
                  .replace(/<\/body>[\s\S]*?<\/html>/i, ''),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
