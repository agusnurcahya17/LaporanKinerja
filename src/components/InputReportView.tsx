import React, { useState, useMemo, useEffect } from 'react';
import {
  FilePlus,
  Clock,
  Calendar,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Camera,
  FileText,
  Trash2,
  Sparkles,
  Zap,
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  PlusCircle,
  Sun,
} from 'lucide-react';
import { RoutineTemplate, ReportItem } from '../types';
import {
  getTodayDateString,
  isFridayOrSaturday,
  normalizeTimeFormat,
  toInputTimeFormat,
  getDayName,
  formatDisplayDate,
  parseTimeToMinutes,
} from '../utils/dateHelpers';
import {
  compressImageUnder300KB,
  CompressionResult,
} from '../utils/imageCompressor';

interface InputReportViewProps {
  templates: RoutineTemplate[];
  onSubmitReport: (
    report: Omit<ReportItem, 'id' | 'createdAt'>,
    photoFile?: File,
    docFile?: File
  ) => Promise<void>;
  onSubmitBatchReports?: (
    reports: Omit<ReportItem, 'id' | 'createdAt'>[]
  ) => Promise<void>;
  isSubmitting: boolean;
  onNavigateToTemplates: () => void;
  initialDate?: string | null;
  onClearInitialDate?: () => void;
}

export const InputReportView: React.FC<InputReportViewProps> = ({
  templates,
  onSubmitReport,
  onSubmitBatchReports,
  isSubmitting,
  onNavigateToTemplates,
  initialDate,
  onClearInitialDate,
}) => {
  const [tanggal, setTanggal] = useState<string>(() => initialDate || getTodayDateString());

  useEffect(() => {
    if (initialDate) {
      setTanggal(initialDate);
    }
  }, [initialDate]);

  const [jamMulai, setJamMulai] = useState<string>('07:30');
  const [uraian, setUraian] = useState<string>('');
  const [output, setOutput] = useState<string>('1 Kegiatan');

  // Multi-checklist state for routine activities
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  // Photo compression states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Document states
  const [docFile, setDocFile] = useState<File | null>(null);

  // Feedback banner
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Active template notification
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);

  // Quick output chips
  const outputPresets = [
    '1 Kegiatan',
    '1 Laporan',
    '1 Berkas',
    'Terlaksananya Pembersihan Lingkungan',
    'Terpeliharanya Kebersihan & Sanitasi',
    'Kelancaran & Keamanan Siswa/Tamu',
  ];

  // Calculate routine time dynamically based on selected date
  const getTemplateTime = (tmpl: RoutineTemplate, targetDate: string): string => {
    if (tmpl.tipeJam === 'day_dependent' && tmpl.jamJumatSabtu) {
      const isWeekend = isFridayOrSaturday(targetDate);
      return isWeekend ? tmpl.jamJumatSabtu : tmpl.jamDefault;
    }
    return tmpl.jamDefault;
  };

  // Sort templates strictly from morning to afternoon (pagi ke siang) based on current date
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const timeA = getTemplateTime(a, tanggal);
      const timeB = getTemplateTime(b, tanggal);
      return parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB);
    });
  }, [templates, tanggal]);

  // Toggle single template checkbox
  const handleToggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (selectedTemplateIds.size === sortedTemplates.length) {
      setSelectedTemplateIds(new Set());
    } else {
      setSelectedTemplateIds(new Set(sortedTemplates.map((t) => t.id)));
    }
  };

  // Submit all selected routine templates at once (Batch Checklist in morning-to-afternoon order)
  const handleSaveCheckedRoutines = async () => {
    if (selectedTemplateIds.size === 0 || !onSubmitBatchReports) return;

    // Filter maintaining morning to afternoon order
    const selectedTemplates = sortedTemplates.filter((t) => selectedTemplateIds.has(t.id));
    const batchData: Omit<ReportItem, 'id' | 'createdAt'>[] = selectedTemplates.map((t) => ({
      tanggal,
      jamMulai: normalizeTimeFormat(getTemplateTime(t, tanggal)),
      uraian: t.uraian,
      output: t.outputDefault || '1 Kegiatan',
    }));

    try {
      await onSubmitBatchReports(batchData);
      setStatusMessage({
        type: 'success',
        text: `Berhasil mencatat ${selectedTemplates.length} kegiatan rutin sekaligus untuk tanggal ${formatDisplayDate(tanggal)}!`,
      });
      setSelectedTemplateIds(new Set());
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal mencatat kegiatan rutin sekaligus.',
      });
    }
  };

  // Quick select routine template to populate the single form below
  const handleApplyTemplate = (tmpl: RoutineTemplate) => {
    setUraian(tmpl.uraian);
    if (tmpl.outputDefault) {
      setOutput(tmpl.outputDefault);
    }

    const calculatedTime = getTemplateTime(tmpl, tanggal);
    setJamMulai(toInputTimeFormat(calculatedTime));
    setAppliedTemplateName(tmpl.nama);
    setTimeout(() => setAppliedTemplateName(null), 3500);
  };

  // Handle image selection & automatic client-side canvas compression under 300 KB (Kamera & Galeri HP)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('File harus berupa format gambar (JPG, PNG, JPEG, WEBP)');
      return;
    }

    setPhotoError(null);
    setIsCompressing(true);

    try {
      const compressed = await compressImageUnder300KB(file);
      setCompressionResult(compressed);
      setPhotoFile(compressed.file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses dan mengompresi foto';
      setPhotoError(msg);
      setPhotoFile(null);
      setCompressionResult(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setCompressionResult(null);
    setPhotoError(null);
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
  };

  const handleRemoveDoc = () => {
    setDocFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraian.trim()) {
      setStatusMessage({ type: 'error', text: 'Uraian kegiatan wajib diisi!' });
      return;
    }

    setStatusMessage(null);
    try {
      await onSubmitReport(
        {
          tanggal,
          jamMulai: normalizeTimeFormat(jamMulai),
          uraian: uraian.trim(),
          output: output.trim(),
        },
        photoFile || undefined,
        docFile || undefined
      );

      setStatusMessage({
        type: 'success',
        text: 'Laporan kinerja harian berhasil disimpan!',
      });

      // Reset form fields
      setUraian('');
      setPhotoFile(null);
      setCompressionResult(null);
      setDocFile(null);
      setOutput('1 Kegiatan');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan laporan';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const currentDayName = getDayName(tanggal);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Input Laporan Kinerja Harian ASN PPPK
            </h2>
            <p className="text-xs text-slate-500">
              Pilih tanggal, gunakan checklist kegiatan rutin sekaligus, atau isi formulir detail.
            </p>
          </div>
        </div>

        {/* Global Date Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 outline-hidden font-mono cursor-pointer"
          />
          <span className="font-semibold text-emerald-700">({currentDayName})</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2
            className={`w-5 h-5 shrink-0 ${
              statusMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          />
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION AKTIVITAS RUTIN (RINGKAS & MULTI-CHECKLIST SEKALIGUS) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Aktivitas Rutin Hari Ini ({currentDayName})
            </h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
              {sortedTemplates.length} templat
            </span>
            <span className="text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>Urut: Pagi ➔ Siang</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="font-medium text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 transition cursor-pointer"
            >
              {selectedTemplateIds.size === templates.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Batal Pilih</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pilih Semua</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToTemplates}
              className="text-[11px] text-slate-400 hover:text-emerald-700 flex items-center space-x-0.5 transition"
              title="Kelola templat rutin"
            >
              <span>Kelola</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Compact Notification when single template applied */}
        {appliedTemplateName && (
          <div className="mx-4 mt-2.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Templat <strong>"{appliedTemplateName}"</strong> telah diisikan ke formulir di bawah.
            </span>
          </div>
        )}

        {/* Action Bar when items are selected */}
        {selectedTemplateIds.size > 0 && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-emerald-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>{selectedTemplateIds.size} kegiatan</strong> siap disimpan sekaligus untuk tanggal{' '}
                <strong>{formatDisplayDate(tanggal)}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveCheckedRoutines}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Simpan Sekaligus ({selectedTemplateIds.size} Kegiatan)</span>
            </button>
          </div>
        )}

        {/* Ultra-Compact Routine Checklist Items Grid (Sorted Pagi ke Siang) */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedTemplates.map((tmpl) => {
            const isChecked = selectedTemplateIds.has(tmpl.id);
            const displayTime = getTemplateTime(tmpl, tanggal);

            return (
              <div
                key={tmpl.id}
                className={`p-2.5 rounded-lg border text-xs transition flex items-start space-x-2.5 select-none ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400/20 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Clickable Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleTemplate(tmpl.id)}
                  className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition cursor-pointer shrink-0"
                  title={isChecked ? 'Batal pilih' : 'Centang untuk simpan sekaligus'}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                  )}
                </button>

                {/* Content */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleToggleTemplate(tmpl.id)}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-slate-800 truncate" title={tmpl.nama}>
                      {tmpl.nama}
                    </span>
                    <span className="font-mono text-[10.5px] bg-emerald-100/80 text-emerald-800 font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                      {displayTime}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-tight">
                    {tmpl.uraian}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">Output: {tmpl.outputDefault}</span>
                  </div>
                </div>

                {/* Quick Button to fill single form below */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTemplate(tmpl);
                  }}
                  className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition shrink-0"
                  title="Gunakan templat ini untuk formulir detail di bawah"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM INPUT LAPORAN DETAIL SATUAN */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
            Formulir Rincian Kegiatan
          </h3>
          <span className="text-[11px] text-slate-400">
            Gunakan untuk kegiatan kustom atau melampirkan foto/dokumen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Jam Mulai SAJA (Strictly no jam selesai) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>
                Jam Mulai <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                Hanya Jam Mulai (Tanpa Jam Selesai)
              </span>
            </label>
            <div className="relative">
              <input
                type="time"
                required
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono font-medium text-slate-800"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </div>
            {/* Quick time pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['06:15', '07:30', '08:00', '10:30', '11:10', '13:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setJamMulai(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition ${
                    jamMulai === t
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Hasil / Output */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hasil / Output Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Contoh: 1 Kegiatan / 1 Laporan / Terlaksananya pembersihan..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {outputPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOutput(preset)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                    output === preset
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Uraian Kegiatan / Pekerjaan */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Uraian Kegiatan / Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">{uraian.length} karakter</span>
          </div>
          <textarea
            required
            rows={3}
            value={uraian}
            onChange={(e) => setUraian(e.target.value)}
            placeholder="Jelaskan secara rinci pekerjaan teknis yang dilakukan..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden leading-relaxed text-slate-800"
          />
        </div>

        {/* ATTACHMENTS SECTION */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Lampiran Foto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Lampiran Foto (Opsional)</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Kompresi Otomatis &lt; 300 KB
              </span>
            </div>

            {photoError && (
              <p className="text-xs text-rose-600 font-medium">{photoError}</p>
            )}

            {isCompressing && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-emerald-800">
                  Mengompresi foto via Canvas (&lt; 300 KB)...
                </p>
                <p className="text-[10.5px] text-emerald-600">
                  Menyesuaikan resolusi untuk kamera & galeri HP
                </p>
              </div>
            )}

            {!isCompressing && !compressionResult && (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group active:scale-[0.99]">
                <div className="flex items-center justify-center space-x-2 text-slate-400 group-hover:text-emerald-600 mb-2 transition">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs group-hover:border-emerald-300">
                    <Camera className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-slate-300">/</span>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs group-hover:border-emerald-300">
                    <ImageIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  Pilih / Ambil Foto Dokumentasi
                </span>
                <span className="text-[11px] text-emerald-700 font-medium mt-1 bg-emerald-50/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Kamera Langsung atau Galeri HP
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Format JPG, PNG, WEBP • Otomatis dikompresi &lt; 300 KB
                </span>
                {/* Native camera & gallery file input without restrictive capture attribute */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}

            {compressionResult && (
              <div className="border border-emerald-200 rounded-xl p-2.5 bg-emerald-50/20 space-y-2">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                  <img
                    src={compressionResult.previewUrl}
                    alt="Preview kompresi"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explicit indicator requested by user: "Foto siap diunggah: 280 KB" */}
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Foto siap diunggah: {compressionResult.compressedFormatted}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      &lt; 300 KB (Hemat {compressionResult.reductionPercentage}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>
                      Ukuran asli: <span className="line-through text-slate-400">{compressionResult.originalFormatted}</span>
                    </span>
                    <label className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer underline flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>Ganti Foto (Kamera / Galeri)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Lampiran Dokumen */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Lampiran Dokumen PDF / Word (Opsional)</span>
            </label>

            {!docFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mb-1.5 transition" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                  Pilih File Dokumen
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Format .pdf, .docx, .doc
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {docFile.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(docFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDoc}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition shrink-0"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tersimpan aman di Google Sheets & perangkat Anda.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan Laporan...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-4 h-4" />
                <span>Simpan Laporan Kegiatan Ini</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
