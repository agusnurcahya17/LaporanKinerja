import React, { useState } from 'react';
import { UserProfile, AuthUser } from '../types';
import { UserCheck, Save, CheckCircle2, Building, User, MapPin, LogOut, ShieldCheck } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (newProfile: UserProfile) => Promise<void>;
  isSaving: boolean;
  spreadsheetUrl: string | null;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onSaveProfile,
  isSaving,
  spreadsheetUrl,
  user,
  onLogout,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    try {
      await onSaveProfile(formData);
      setSuccessMessage('Data profil berhasil disimpan ke Google Sheets & perangkat!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      // Error handled in parent
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Pengaturan Profil & Identitas ASN PPPK
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data identitas Anda dan Atasan Langsung untuk kop dan lembar tanda tangan dokumen laporan.
            </p>
          </div>
        </div>

        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
          >
            <span>Tersinkron di Tab PROFIL_PEGAWAI</span>
          </a>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bagian Pegawai PPPK */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Identitas Pegawai PPPK (Tenaga Teknis)
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                placeholder="Contoh: Ahmad Fauzi, S.Kom."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP PPPK <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nip}
                onChange={(e) => handleChange('nip', e.target.value)}
                placeholder="Contoh: 19930415 202421 1 008"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan PPPK <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.jabatan}
                onChange={(e) => handleChange('jabatan', e.target.value)}
                placeholder="Contoh: Pengadministrasi Perkantoran / Operator Layanan Operasional"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Kerja / Instansi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unitKerja}
                onChange={(e) => handleChange('unitKerja', e.target.value)}
                placeholder="Contoh: SD Negeri 1 Sukamaju, Kec. Cisarua"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota / Kabupaten (Tempat Dokumen) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.kota}
                  onChange={(e) => handleChange('kota', e.target.value)}
                  placeholder="Contoh: Bandung, Cianjur, Jakarta Barat"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Akan dicetak sebelum tanggal pada tanda tangan, misalnya: <span className="font-semibold">{formData.kota || 'Kota'}, 31 Oktober 2026</span>
              </p>
            </div>
          </div>

          {/* Bagian Atasan Langsung */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Identitas Atasan Langsung
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Atasan Langsung & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.namaAtasan}
                onChange={(e) => handleChange('namaAtasan', e.target.value)}
                placeholder="Contoh: Dra. Hj. Siti Nurhasanah, M.Pd."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP Atasan Langsung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nipAtasan}
                onChange={(e) => handleChange('nipAtasan', e.target.value)}
                placeholder="Contoh: 19750820 199903 2 004"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Atasan Langsung <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.jabatanAtasan}
                onChange={(e) => handleChange('jabatanAtasan', e.target.value)}
                placeholder="Contoh: Kepala Sekolah / Kasubbag Tata Usaha"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>

            {/* Preview Box */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Pratinjau Format Lembar Tanda Tangan:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="border-r border-slate-200 pr-2">
                  <div className="font-semibold text-slate-700">Mengetahui,</div>
                  <div>{formData.jabatanAtasan || 'Jabatan Atasan'}</div>
                  <div className="my-3 text-slate-400 italic">(Tanda Tangan)</div>
                  <div className="font-bold underline text-slate-800">
                    {formData.namaAtasan || 'Nama Atasan'}
                  </div>
                  <div>NIP. {formData.nipAtasan || '-----------------'}</div>
                </div>
                <div className="pl-2">
                  <div className="text-slate-700">
                    {formData.kota || 'Kota'}, [Tanggal Cetak]
                  </div>
                  <div className="font-semibold text-slate-700">Pegawai PPPK</div>
                  <div className="my-3 text-slate-400 italic">(Tanda Tangan)</div>
                  <div className="font-bold underline text-slate-800">
                    {formData.nama || 'Nama Pegawai'}
                  </div>
                  <div>NIP. {formData.nip || '-----------------'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan ke Google Sheets...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Profil</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sesi Akun Google & Tombol Logout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Sesi Akun Google & Keamanan
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            ● Auto-Login Aktif (Tersimpan)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-slate-800">
                {user?.displayName || 'Pengguna Akun Google'}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {user?.email || 'Akun Google Terhubung'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sesi login Google Anda tersimpan di peramban ini agar dapat otomatis masuk tanpa perlu menekan tombol Login setiap kali membuka aplikasi.
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar / Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {onLogout && (
        <ConfirmModal
          isOpen={isLogoutModalOpen}
          title="Konfirmasi Keluar / Logout"
          message="Apakah Anda yakin ingin keluar dari aplikasi? Sesi token Google di perangkat ini akan dihapus dan Anda akan dialihkan kembali ke layar Login utama."
          confirmLabel="Ya, Keluar Akun"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            onLogout();
          }}
          onCancel={() => setIsLogoutModalOpen(false)}
        />
      )}
    </div>
  );
};
