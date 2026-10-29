export const NAMA_BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const NAMA_HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
};

export const isFridayOrSaturday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0: Sunday, 5: Friday, 6: Saturday
  return dayOfWeek === 5 || dayOfWeek === 6;
};

export const getDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return NAMA_HARI_INDONESIA[d.getDay()] || '';
};

export const getMonthName = (monthNumber: number): string => {
  return NAMA_BULAN_INDONESIA[monthNumber - 1] || '';
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const hari = NAMA_HARI_INDONESIA[d.getDay()] || '';
  const bulan = NAMA_BULAN_INDONESIA[month - 1] || '';
  return `${hari}, ${day} ${bulan} ${year}`;
};

export const formatTanggalIndonesia = formatDisplayDate;

export const formatTanggalRingkas = (dateStr: string): string => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const bulan = NAMA_BULAN_INDONESIA[month - 1] || '';
  return `${day} ${bulan} ${year}`;
};

// Convert HH:mm to HH.mm standard Indonesian government time display
export const normalizeTimeFormat = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.replace(':', '.');
};

// Convert HH.mm back to HH:mm for HTML time input
export const toInputTimeFormat = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.replace('.', ':');
};

// Parse time string (e.g. "06.15", "08:00", "11.10", "13.00") into minutes from midnight for chronological sorting
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9999;
  const clean = timeStr.trim().replace(':', '.');
  const match = clean.match(/^(\d{1,2})[.:](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    return hours * 60 + mins;
  }
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    const hours = Math.floor(num);
    const mins = Math.round((num - hours) * 100);
    return hours * 60 + mins;
  }
  return 9999;
};

