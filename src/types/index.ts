export interface UserProfile {
  nama: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  namaAtasan: string;
  nipAtasan: string;
  jabatanAtasan: string;
  kota: string;
}

export interface ReportItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  uraian: string;
  output: string;
  fotoUrl?: string;
  fotoId?: string;
  docUrl?: string;
  docId?: string;
  docName?: string;
  createdAt: string;
}

export interface RoutineTemplate {
  id: string;
  nama: string;
  uraian: string;
  outputDefault: string;
  tipeJam: 'fixed' | 'day_dependent';
  jamDefault: string; // HH:mm (e.g., 06:15 or default)
  jamJumatSabtu?: string; // HH:mm (e.g., 10:30 for gate keeper on Friday-Saturday)
  keterangan?: string;
}

export interface SyncStatus {
  isChecking: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  folderId: string | null;
  folderUrl: string | null;
  lastSyncedAt: Date | null;
  error: string | null;
}

export interface AuthUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

