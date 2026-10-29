import { UserProfile, ReportItem } from '../types';
import {
  NAMA_BULAN_INDONESIA,
  formatTanggalIndonesia,
  formatTanggalRingkas,
} from './docxExport';

export interface HtmlReportOptions {
  mode: 'bulanan' | 'harian';
  profile: UserProfile;
  reports: ReportItem[];
  bulan?: number;
  tahun?: number;
  tanggalHarian?: string;
  tanggalCetak: string;
  includePhotos?: boolean;
}

export const getDriveImageThumbnailUrl = (fotoUrl?: string, fotoId?: string): string => {
  let fileId = fotoId;
  if (!fileId && fotoUrl) {
    const match =
      fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      fotoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
  }

  if (fileId) {
    // Google Drive direct image thumbnail CDN endpoint
    return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
  }

  return fotoUrl || '';
};

export const getDriveThumbnailFallbackUrl = (fotoUrl?: string, fotoId?: string): string => {
  let fileId = fotoId;
  if (!fileId && fotoUrl) {
    const match =
      fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      fotoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  return fotoUrl || '';
};

export const generateHtmlReportString = (options: HtmlReportOptions): string => {
  const {
    mode,
    profile,
    reports,
    bulan = new Date().getMonth() + 1,
    tahun = new Date().getFullYear(),
    tanggalHarian = new Date().toISOString().split('T')[0],
    tanggalCetak,
  } = options;

  const namaBulan = NAMA_BULAN_INDONESIA[bulan - 1] || '';
  const tanggalCetakFormatted = formatTanggalRingkas(tanggalCetak);
  const kotaFormatted = profile.kota ? profile.kota.trim() : 'Tempat';

  // Sort reports
  const sortedReports = [...reports].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  const kopTitle =
    'LAPORAN KINERJA HARIAN PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA (PPPK)';
  const kopSubtitle1 =
    mode === 'harian'
      ? 'LEMBAR PENGESAHAN KINERJA HARIAN - TENAGA TEKNIS'
      : 'TENAGA TEKNIS';
  const kopSubtitle2 =
    mode === 'harian'
      ? `HARI / TANGGAL: ${formatTanggalIndonesia(tanggalHarian).toUpperCase()}`
      : `PERIODE: BULAN ${namaBulan.toUpperCase()} TAHUN ${tahun}`;

  // Group reports chronologically by date
  const groupedByDate = new Map<string, ReportItem[]>();
  sortedReports.forEach((item) => {
    const d = item.tanggal || '';
    if (!groupedByDate.has(d)) {
      groupedByDate.set(d, []);
    }
    groupedByDate.get(d)!.push(item);
  });

  let dailyTablesHtml = '';

  if (groupedByDate.size === 0) {
    dailyTablesHtml = `
      <div style="margin-top: 18px; margin-bottom: 6px; font-size: 12px; font-weight: 500; color: #000000;">
        Hari/tanggal : -
      </div>
      <table class="activity-table">
        <thead>
          <tr>
            <th style="width: 36px;">No</th>
            <th style="width: 80px;">Jam Mulai</th>
            <th>Uraian Kegiatan / Pekerjaan</th>
            <th style="width: 125px;">Hasil / Output</th>
            <th style="width: 110px;">Dokumentasi / Foto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" style="text-align: center; padding: 24px; color: #64748b; font-style: italic;">
              Tidak ada data laporan kinerja pada periode ini.
            </td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    groupedByDate.forEach((dayItems, dateKey) => {
      const rowsHtml = dayItems
        .map((item, index) => {
          const hasPhoto = Boolean(item.fotoUrl || item.fotoId);
          const thumbUrl = getDriveImageThumbnailUrl(item.fotoUrl, item.fotoId);
          const fallbackThumbUrl = getDriveThumbnailFallbackUrl(item.fotoUrl, item.fotoId);
          const viewDriveUrl = item.fotoUrl || `https://drive.google.com/file/d/${item.fotoId}/view`;

          const photoCellHtml = hasPhoto
            ? `<a href="${viewDriveUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none;" title="Buka foto ukuran penuh di Google Drive">
                <img
                  src="${thumbUrl}"
                  alt="Dokumentasi #${index + 1}"
                  style="width: 90px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #94a3b8; display: block; margin: 0 auto; background: #e2e8f0;"
                  onerror="if(!this.dataset.retried){this.dataset.retried='1';this.src='${fallbackThumbUrl}';}"
                />
              </a>`
            : `<span style="color: #94a3b8; font-size: 11px;">-</span>`;

          return `
            <tr>
              <td style="text-align: center; padding: 8px 6px; border: 1px solid #1e293b; font-weight: 500;">${
                index + 1
              }</td>
              <td style="text-align: center; padding: 8px 6px; border: 1px solid #1e293b; font-family: monospace; font-weight: 600; color: #047857;">${
                item.jamMulai || '-'
              }</td>
              <td style="padding: 8px 10px; border: 1px solid #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(
                item.uraian
              )}</td>
              <td style="padding: 8px 10px; border: 1px solid #1e293b;">${escapeHtml(
                item.output
              )}</td>
              <td style="text-align: center; padding: 6px; border: 1px solid #1e293b; vertical-align: middle;">
                ${photoCellHtml}
              </td>
            </tr>
          `;
        })
        .join('');

      dailyTablesHtml += `
        <div class="day-group" style="margin-bottom: 20px;">
          <div style="margin-top: 16px; margin-bottom: 6px; font-size: 12px; font-weight: 500; color: #000000;">
            Hari/tanggal : ${formatTanggalIndonesia(dateKey)}
          </div>
          <table class="activity-table">
            <thead>
              <tr>
                <th style="width: 36px;">No</th>
                <th style="width: 80px;">Jam Mulai</th>
                <th>Uraian Kegiatan / Pekerjaan</th>
                <th style="width: 125px;">Hasil / Output</th>
                <th style="width: 110px;">Dokumentasi / Foto</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    });
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${
    mode === 'harian'
      ? `Laporan_Harian_PPPK_${tanggalHarian}`
      : `Laporan_Kinerja_PPPK_${namaBulan}_${tahun}`
  }</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #f1f5f9;
      line-height: 1.4;
      font-size: 12px;
    }

    /* Top Sticky Action Toolbar (Hidden when printing) */
    .top-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-bottom: 1px solid #334155;
    }
    .toolbar-title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-print {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4);
    }
    .btn-print:hover {
      background: #047857;
    }
    .btn-close {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-close:hover {
      background: #475569;
      color: #ffffff;
    }

    /* Document Sheet Wrapper */
    .sheet-container {
      max-width: 900px;
      margin: 24px auto 48px auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      border: 1px solid #cbd5e1;
    }

    /* KOP */
    .kop {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 3px double #0f172a;
      margin-bottom: 24px;
    }
    .kop-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.2px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-subtitle1 {
      font-size: 13px;
      font-weight: 700;
      margin-top: 4px;
      text-transform: uppercase;
      color: #1e293b;
    }
    .kop-subtitle2 {
      font-size: 12px;
      font-weight: 700;
      margin-top: 4px;
      color: #334155;
      text-transform: uppercase;
    }

    /* Identity section */
    .identity-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .identity-table td {
      padding: 4px 2px;
      vertical-align: top;
    }
    .identity-label {
      width: 180px;
      font-weight: 600;
      color: #334155;
    }
    .identity-separator {
      width: 16px;
      text-align: center;
    }
    .identity-value {
      color: #0f172a;
    }

    /* Main Activity Table */
    .activity-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 11.5px;
    }
    .activity-table th {
      background-color: #f1f5f9;
      border: 1px solid #0f172a;
      padding: 9px 8px;
      font-weight: 700;
      text-align: center;
      color: #0f172a;
    }
    .activity-table td {
      border: 1px solid #0f172a;
      vertical-align: top;
    }

    /* Signature Section */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
      font-size: 12px;
      color: #0f172a;
    }
    .signature-box {
      display: flex;
      flex-direction: column;
    }
    .signature-space {
      height: 80px;
    }
    .signature-name {
      font-weight: 700;
      text-decoration: underline;
    }
    .signature-nip {
      font-family: monospace;
      font-size: 11px;
      margin-top: 2px;
    }

    /* Photos Section */
    .photos-section {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px dashed #94a3b8;
    }
    .photos-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .photos-header h3 {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .photos-header p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .photo-wrapper {
      width: 100%;
      height: 220px;
      border-radius: 6px;
      overflow: hidden;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
      margin-bottom: 8px;
    }
    .photo-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-meta {
      font-size: 11px;
    }
    .photo-meta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }
    .photo-time {
      font-family: monospace;
      font-weight: 600;
      color: #047857;
      font-size: 10.5px;
    }
    .photo-date {
      color: #475569;
      font-weight: 500;
      font-size: 10.5px;
    }
    .photo-desc {
      margin-top: 4px;
      color: #1e293b;
      line-height: 1.35;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .page-break-before {
      page-break-before: always;
      break-before: page;
    }

    /* Print media styling */
    @media print {
      body {
        background: #ffffff !important;
        font-size: 11.5px;
        color: #000000 !important;
      }
      .no-print,
      .top-toolbar {
        display: none !important;
      }
      .sheet-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm 12mm 15mm 12mm;
      }
      .photos-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .photo-wrapper {
        height: 190px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Top Action Toolbar -->
  <div class="top-toolbar no-print">
    <div class="toolbar-title">
      <span>📄 Pratinjau Dokumen HTML (${mode === 'harian' ? 'Mode Harian' : 'Mode Bulanan'})</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-close" onclick="window.close()">✕ Tutup Jendela</button>
    </div>
  </div>

  <div class="sheet-container">
    <!-- KOP -->
    <div class="kop">
      <div class="kop-title">${kopTitle}</div>
      <div class="kop-subtitle1">${kopSubtitle1}</div>
      <div class="kop-subtitle2">${kopSubtitle2}</div>
    </div>

    <!-- IDENTITAS -->
    <table class="identity-table">
      <tbody>
        <tr>
          <td class="identity-label">Nama Pegawai</td>
          <td class="identity-separator">:</td>
          <td class="identity-value"><strong>${escapeHtml(profile.nama || '-')}</strong></td>
        </tr>
        <tr>
          <td class="identity-label">NIP PPPK</td>
          <td class="identity-separator">:</td>
          <td class="identity-value" style="font-family: monospace;">${escapeHtml(profile.nip || '-')}</td>
        </tr>
        <tr>
          <td class="identity-label">Jabatan</td>
          <td class="identity-separator">:</td>
          <td class="identity-value">${escapeHtml(profile.jabatan || '-')}</td>
        </tr>
        <tr>
          <td class="identity-label">Unit Kerja / Instansi</td>
          <td class="identity-separator">:</td>
          <td class="identity-value">${escapeHtml(profile.unitKerja || '-')}</td>
        </tr>
        <tr>
          <td class="identity-label">Atasan Langsung</td>
          <td class="identity-separator">:</td>
          <td class="identity-value">${escapeHtml(profile.namaAtasan || '-')} (${escapeHtml(profile.jabatanAtasan || 'Atasan')})</td>
        </tr>
      </tbody>
    </table>

    <!-- TABEL KEGIATAN PER HARI/TANGGAL -->
    ${dailyTablesHtml}

    <!-- LEMBAR PENGESAHAN TANDA TANGAN DUA KOLOM -->
    <div class="signature-grid avoid-break">
      <div class="signature-box">
        <div>Mengetahui,</div>
        <div style="font-weight: 700;">${escapeHtml(profile.jabatanAtasan || 'Atasan Langsung')}</div>
        <div class="signature-space"></div>
        <div class="signature-name">${
          profile.namaAtasan
            ? `(${escapeHtml(profile.namaAtasan)})`
            : '(............................................)'
        }</div>
        <div class="signature-nip">NIP. ${escapeHtml(profile.nipAtasan || '.....................................')}</div>
      </div>

      <div class="signature-box">
        <div>${escapeHtml(kotaFormatted)}, ${tanggalCetakFormatted}</div>
        <div style="font-weight: 700;">Pegawai Yang Bersangkutan (PPPK)</div>
        <div class="signature-space"></div>
        <div class="signature-name">${
          profile.nama
            ? `(${escapeHtml(profile.nama)})`
            : '(............................................)'
        }</div>
        <div class="signature-nip">NIP. ${escapeHtml(profile.nip || '.....................................')}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const openHtmlReportInNewTab = (htmlContent: string): boolean => {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      return false; // Popup blocked
    }
    return true;
  } catch (err) {
    console.error('Failed to open window:', err);
    return false;
  }
};
