import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  Sun,
  Layers,
} from 'lucide-react';
import { RoutineTemplate } from '../types';
import { DEFAULT_TEMPLATES } from '../services/googleDriveSheets';
import { ConfirmModal } from './ConfirmModal';
import { parseTimeToMinutes } from '../utils/dateHelpers';
import {
  generateUraianFromJudul,
  ROUTINE_PRESETS,
  RoutineTaskPreset,
} from '../utils/routineTaskSuggestions';

interface RoutineTemplatesViewProps {
  templates: RoutineTemplate[];
  onSaveTemplates: (updated: RoutineTemplate[]) => Promise<void>;
  isSaving: boolean;
}

export const RoutineTemplatesView: React.FC<RoutineTemplatesViewProps> = ({
  templates,
  onSaveTemplates,
  isSaving,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<RoutineTemplate | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<RoutineTemplate | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<RoutineTemplate>({
    id: '',
    nama: '',
    uraian: '',
    outputDefault: '1 Kegiatan',
    tipeJam: 'fixed',
    jamDefault: '07.30',
    jamJumatSabtu: '',
  });

  // Sort templates strictly from morning to afternoon (pagi ke siang)
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      return parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault);
    });
  }, [templates]);

  const handleStartAdd = () => {
    setFormData({
      id: `tmpl-${Date.now()}`,
      nama: '',
      uraian: '',
      outputDefault: '1 Kegiatan',
      tipeJam: 'fixed',
      jamDefault: '07.30',
      jamJumatSabtu: '',
    });
    setAutoFillNotice(null);
    setIsAddingNew(true);
    setEditingTemplate(null);
  };

  const handleStartEdit = (tmpl: RoutineTemplate) => {
    setFormData({ ...tmpl });
    setAutoFillNotice(null);
    setEditingTemplate(tmpl);
    setIsAddingNew(false);
  };

  const handleCancelModal = () => {
    setIsAddingNew(false);
    setEditingTemplate(null);
    setAutoFillNotice(null);
  };

  // Smart auto-fill description based on entered title
  const handleAutoFillUraian = (customJudul?: string) => {
    const titleToUse = customJudul !== undefined ? customJudul : formData.nama;
    if (!titleToUse.trim()) return;

    const result = generateUraianFromJudul(titleToUse);
    setFormData((prev) => ({
      ...prev,
      uraian: result.uraian,
      outputDefault:
        prev.outputDefault && prev.outputDefault !== '1 Kegiatan'
          ? prev.outputDefault
          : result.outputDefault,
      jamDefault: prev.jamDefault && prev.jamDefault !== '07.30' ? prev.jamDefault : result.jamDefault,
      tipeJam: result.tipeJam || prev.tipeJam,
      jamJumatSabtu: result.jamJumatSabtu || prev.jamJumatSabtu,
    }));

    setAutoFillNotice('✨ Uraian lengkap berhasil diisi otomatis sesuai judul!');
    setTimeout(() => setAutoFillNotice(null), 4000);
  };

  // Select a preset chip directly
  const handleSelectPreset = (preset: RoutineTaskPreset) => {
    setFormData((prev) => ({
      ...prev,
      nama: preset.nama,
      uraian: preset.uraian,
      outputDefault: preset.outputDefault,
      jamDefault: preset.jamDefault,
      tipeJam: preset.tipeJam,
      jamJumatSabtu: preset.jamJumatSabtu || '',
    }));
    setAutoFillNotice(`✨ Templat "${preset.nama}" berhasil diterapkan lengkap!`);
    setTimeout(() => setAutoFillNotice(null), 4000);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.uraian.trim()) return;

    let updatedList: RoutineTemplate[] = [];
    if (isAddingNew) {
      updatedList = [...templates, { ...formData, id: `tmpl-${Date.now()}` }];
    } else if (editingTemplate) {
      updatedList = templates.map((t) => (t.id === editingTemplate.id ? formData : t));
    }

    // Keep list sorted from morning to afternoon
    updatedList.sort(
      (a, b) => parseTimeToMinutes(a.jamDefault) - parseTimeToMinutes(b.jamDefault)
    );

    try {
      await onSaveTemplates(updatedList);
      setSuccessMessage('Daftar templat aktivitas rutin berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(null), 3000);
      handleCancelModal();
    } catch {
      // Handled in parent
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    const updatedList = templates.filter((t) => t.id !== deleteCandidate.id);
    try {
      await onSaveTemplates(updatedList);
      setSuccessMessage(`Templat "${deleteCandidate.nama}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeleteCandidate(null);
    } catch {
      // Handled in parent
    }
  };

  const handleResetDefaults = async () => {
    try {
      await onSaveTemplates(DEFAULT_TEMPLATES);
      setSuccessMessage('Templat berhasil direset ke 3 templat bawaan standar.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-800">
                Kelola Templat Aktivitas Rutin Harian
              </h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <Sun className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>Urut: Jam Pagi ➔ Siang</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur daftar kegiatan rutin berulang. Templat diurutkan otomatis dari jam mulai pagi ke jam siang.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
            title="Reset ke templat bawaan standar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
          <button
            type="button"
            onClick={handleStartAdd}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Templat Baru</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Templates List - Sorted from morning to afternoon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedTemplates.map((tmpl, idx) => {
          return (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{tmpl.nama}</h3>
                  </div>

                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{tmpl.jamDefault}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {tmpl.uraian}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Jadwal Jam:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {tmpl.tipeJam === 'day_dependent'
                        ? `${tmpl.jamDefault} (Sen-Kam) | ${tmpl.jamJumatSabtu} (Jum-Sab)`
                        : `${tmpl.jamDefault} (Setiap Hari Kerja)`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Output Default:</span>
                    <span className="font-medium text-slate-700">{tmpl.outputDefault}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(tmpl)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(tmpl)}
                  className="px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Template with Auto-Fill Feature */}
      {(isAddingNew || editingTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  {isAddingNew ? 'Tambah Templat Aktivitas Baru' : 'Edit Templat Aktivitas'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Feedback Notice for Auto-Fill */}
              {autoFillNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{autoFillNotice}</span>
                </div>
              )}

              {/* Judul / Nama Templat */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Templat / Judul Singkat <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAutoFillUraian()}
                    disabled={!formData.nama.trim()}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1 transition disabled:opacity-40 cursor-pointer"
                    title="Klik untuk otomatis mengisi uraian lengkap berdasarkan judul"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Otomatis Isi Uraian</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  onBlur={() => {
                    // Otomatis isi uraian setelah mengisi judul jika uraian masih kosong
                    if (formData.nama.trim() && !formData.uraian.trim()) {
                      handleAutoFillUraian();
                    }
                  }}
                  placeholder="Contoh: Menyiram Tanaman, Cek Lampu & Listrik, Arsip Surat..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />

                {/* Quick Recommendation Chips */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10.5px] font-medium text-slate-500">
                    💡 Rekomendasi Cepat Tugas ASN PPPK (Klik untuk isi otomatis):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {ROUTINE_PRESETS.slice(0, 10).map((p) => (
                      <button
                        key={p.nama}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="text-[10.5px] px-2 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 transition cursor-pointer"
                      >
                        + {p.nama}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Uraian Lengkap Kegiatan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Uraian Lengkap Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAutoFillUraian()}
                    disabled={!formData.nama.trim()}
                    className="text-[10.5px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 transition disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Generate Uraian Formal</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.uraian}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  placeholder="Uraian kegiatan lengkap bahasa resmi kedinasan ASN PPPK..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Uraian dapat diisi otomatis setelah mengetik judul, atau Anda dapat mengedit kalimatnya secara bebas.
                </p>
              </div>

              {/* Output / Hasil Bawaan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Output / Hasil Bawaan
                </label>
                <input
                  type="text"
                  value={formData.outputDefault}
                  onChange={(e) => setFormData({ ...formData, outputDefault: e.target.value })}
                  placeholder="Contoh: 1 Kegiatan / Fasilitas Terawat Bersih"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Tipe Jam & Pengaturan Jam Mulai (Pagi / Siang) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Pengaturan Jam Mulai
                </label>
                <select
                  value={formData.tipeJam}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipeJam: e.target.value as 'fixed' | 'day_dependent',
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="fixed">Jam Tetap Setiap Hari (Misal: 06.30 atau 07.30)</option>
                  <option value="day_dependent">
                    Jam Berbeda (Senin-Kamis vs Jumat-Sabtu)
                  </option>
                </select>
              </div>

              {formData.tipeJam === 'fixed' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Jam Mulai (HH.mm) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Format 24 jam (misal 06.15, 08.00, 11.10)
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.jamDefault}
                    onChange={(e) => setFormData({ ...formData, jamDefault: e.target.value })}
                    placeholder="07.30"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jam Senin-Kamis
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.jamDefault}
                      onChange={(e) => setFormData({ ...formData, jamDefault: e.target.value })}
                      placeholder="11.10"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jam Jumat-Sabtu
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.jamJumatSabtu || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, jamJumatSabtu: e.target.value })
                      }
                      placeholder="10.30"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Templat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Hapus Templat Aktivitas"
        message={`Apakah Anda yakin ingin menghapus templat "${deleteCandidate?.nama}"? Tindakan ini akan memperbarui daftar templat di Google Sheets Anda.`}
        confirmLabel="Hapus Templat"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
