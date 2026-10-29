import { UserProfile, ReportItem, RoutineTemplate } from '../types';

export const DEFAULT_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'tmpl-1',
    nama: 'Menyapu Halaman',
    uraian: 'Menyapu dan membersihkan area halaman, selasar, serta lingkungan kantor/sekolah dari daun kering dan sampah.',
    outputDefault: '1 Kegiatan / Area Halaman Bersih',
    tipeJam: 'fixed',
    jamDefault: '06.15',
    keterangan: 'Rutin Pagi Setiap Hari Kerja',
  },
  {
    id: 'tmpl-2',
    nama: 'Membersihkan Kamar Mandi',
    uraian: 'Membersihkan, menyikat lantai dan kloset, serta mengisi bak mandi / sanitasi kamar mandi staf dan umum.',
    outputDefault: '1 Kegiatan / Sanitasi Bersih & Higienis',
    tipeJam: 'fixed',
    jamDefault: '08.00',
    keterangan: 'Pembersihan Sanitasi Berkala',
  },
  {
    id: 'tmpl-3',
    nama: 'Jaga Gerbang / Menyebrangkan Murid',
    uraian: 'Melaksanakan pengamanan gerbang masuk, membantu menyeberangkan siswa/tamu, dan memantau ketertiban jam pulang sekolah.',
    outputDefault: '1 Kegiatan / Gerbang Aman & Tertib',
    tipeJam: 'day_dependent',
    jamDefault: '11.10', // Senin - Kamis
    jamJumatSabtu: '10.30', // Jumat - Sabtu
    keterangan: 'Jam: 11.10 (Senin-Kamis) | 10.30 (Jumat-Sabtu)',
  },
];

const SPREADSHEET_NAME = 'Laporan_Kinerja_PPPK';
const FOLDER_NAME = 'Lampiran_Laporan_PPPK';

// Local storage cache keys for Drive & Sheets IDs to eliminate redundant searches
const CACHE_SPREADSHEET_ID_KEY = 'pppk_cached_spreadsheet_id';
const CACHE_SPREADSHEET_URL_KEY = 'pppk_cached_spreadsheet_url';
const CACHE_FOLDER_ID_KEY = 'pppk_cached_folder_id';
const CACHE_FOLDER_URL_KEY = 'pppk_cached_folder_url';
const CACHE_STRUCTURE_INITIALIZED_KEY = 'pppk_structure_initialized';

interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}

// 1. Find or create Folder in Google Drive (with LocalStorage cache)
export const findOrCreateFolder = async (
  token: string
): Promise<{ id: string; webViewLink: string }> => {
  const cachedId = localStorage.getItem(CACHE_FOLDER_ID_KEY);
  const cachedUrl = localStorage.getItem(CACHE_FOLDER_URL_KEY);
  if (cachedId && cachedUrl) {
    return { id: cachedId, webViewLink: cachedUrl };
  }

  const query = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    if (searchRes.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
      console.warn('Google Drive rate limit (429). Menggunakan ID sementara.');
      return { id: cachedId || 'cached-folder-id', webViewLink: cachedUrl || '' };
    }
    throw new Error(`Gagal mencari folder di Google Drive: ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folder = searchData.files[0];
    const webViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
    localStorage.setItem(CACHE_FOLDER_ID_KEY, folder.id);
    localStorage.setItem(CACHE_FOLDER_URL_KEY, webViewLink);
    return { id: folder.id, webViewLink };
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Gagal membuat folder di Google Drive: ${errorText}`);
  }

  const newFolder = await createRes.json();
  const folderUrl = newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`;
  localStorage.setItem(CACHE_FOLDER_ID_KEY, newFolder.id);
  localStorage.setItem(CACHE_FOLDER_URL_KEY, folderUrl);
  return { id: newFolder.id, webViewLink: folderUrl };
};

// 2. Find or create Spreadsheet in Google Drive (with LocalStorage cache)
export const findOrCreateSpreadsheet = async (
  token: string
): Promise<{ id: string; webViewLink: string }> => {
  const cachedId = localStorage.getItem(CACHE_SPREADSHEET_ID_KEY);
  const cachedUrl = localStorage.getItem(CACHE_SPREADSHEET_URL_KEY);
  const isInitialized = localStorage.getItem(CACHE_STRUCTURE_INITIALIZED_KEY) === 'true';

  if (cachedId && cachedUrl && isInitialized) {
    return { id: cachedId, webViewLink: cachedUrl };
  }

  const query = encodeURIComponent(
    `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    if (searchRes.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
      console.warn('Google Sheets API rate limit (429) pada pencarian file. Menggunakan ID cache.');
      return { id: cachedId || 'cached-sheet-id', webViewLink: cachedUrl || '' };
    }
    throw new Error(`Gagal mencari Google Sheet: ${errorText}`);
  }

  const searchData = await searchRes.json();
  let spreadsheetId = '';
  let webViewLink = '';

  if (searchData.files && searchData.files.length > 0) {
    spreadsheetId = searchData.files[0].id;
    webViewLink = searchData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  } else {
    // Create new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title: SPREADSHEET_NAME },
        sheets: [
          { properties: { title: 'LAPORAN_HARIAN' } },
          { properties: { title: 'PROFIL_PEGAWAI' } },
          { properties: { title: 'TEMPLAT_RUTIN' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Gagal membuat Google Sheet: ${errorText}`);
    }

    const newSheet = await createRes.json();
    spreadsheetId = newSheet.spreadsheetId;
    webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  localStorage.setItem(CACHE_SPREADSHEET_ID_KEY, spreadsheetId);
  localStorage.setItem(CACHE_SPREADSHEET_URL_KEY, webViewLink);

  // Initialize headers only once if not initialized
  if (!isInitialized) {
    try {
      await initializeSheetsStructure(token, spreadsheetId);
      localStorage.setItem(CACHE_STRUCTURE_INITIALIZED_KEY, 'true');
    } catch (e) {
      console.warn('Inisialisasi header dilewati sementara:', e);
    }
  }

  return { id: spreadsheetId, webViewLink };
};

// Ensure tabs and headers exist in spreadsheet (runs only once per sheet setup)
const initializeSheetsStructure = async (token: string, spreadsheetId: string) => {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) return;

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = metaData.sheets?.map(
    (s: { properties: { title: string } }) => s.properties.title
  ) || [];

  const requiredSheets = ['LAPORAN_HARIAN', 'PROFIL_PEGAWAI', 'TEMPLAT_RUTIN'];
  const missingSheets = requiredSheets.filter((title) => !existingSheetTitles.includes(title));

  if (missingSheets.length > 0) {
    const requests = missingSheets.map((title) => ({
      addSheet: { properties: { title } },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  // Set headers in one combined update to minimize quota usage
  const batchData = [
    {
      range: 'LAPORAN_HARIAN!A1:J1',
      values: [
        [
          'ID',
          'Tanggal',
          'Jam_Mulai',
          'Uraian_Kegiatan',
          'Output_Hasil',
          'Foto_Drive_Link',
          'Foto_File_Id',
          'Dokumen_Drive_Link',
          'Dokumen_File_Id',
          'Dokumen_Nama',
        ],
      ],
    },
    {
      range: 'PROFIL_PEGAWAI!A1:H1',
      values: [
        [
          'Nama_PPPK',
          'NIP_PPPK',
          'Jabatan_PPPK',
          'Unit_Kerja',
          'Nama_Atasan',
          'NIP_Atasan',
          'Jabatan_Atasan',
          'Kota',
        ],
      ],
    },
    {
      range: 'TEMPLAT_RUTIN!A1:G4',
      values: [
        ['ID', 'Nama_Templat', 'Uraian', 'Output_Default', 'Tipe_Jam', 'Jam_Default', 'Jam_Jumat_Sabtu'],
        ...DEFAULT_TEMPLATES.map((t) => [
          t.id,
          t.nama,
          t.uraian,
          t.outputDefault,
          t.tipeJam,
          t.jamDefault,
          t.jamJumatSabtu || '',
        ]),
      ],
    },
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );
};

// 3. Batch Fetch All Data (SINGLE REQUEST for Reports, Profile, and Templates)
export interface BatchFetchResult {
  reports: ReportItem[] | null;
  profile: UserProfile | null;
  templates: RoutineTemplate[] | null;
  rateLimited: boolean;
}

export const batchFetchAllDataFromSheets = async (
  token: string,
  spreadsheetId: string
): Promise<BatchFetchResult> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=LAPORAN_HARIAN!A2:J&ranges=PROFIL_PEGAWAI!A2:H2&ranges=TEMPLAT_RUTIN!A2:G`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      console.warn('Google Sheets API rate limit (429) tercapai. Beralih ke data cache lokal.');
      return { reports: null, profile: null, templates: null, rateLimited: true };
    }

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('Quota exceeded')) {
        console.warn('Google Sheets API Quota exceeded. Beralih ke data cache lokal.');
        return { reports: null, profile: null, templates: null, rateLimited: true };
      }
      throw new Error(`Gagal membaca data dari Sheets: ${errText}`);
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    // Range 0: LAPORAN_HARIAN
    const reportRows = valueRanges[0]?.values || [];
    const reports: ReportItem[] = reportRows.map((row: string[]): ReportItem => ({
      id: row[0] || '',
      tanggal: row[1] || '',
      jamMulai: row[2] || '',
      uraian: row[3] || '',
      output: row[4] || '',
      fotoUrl: row[5] || '',
      fotoId: row[6] || '',
      docUrl: row[7] || '',
      docId: row[8] || '',
      docName: row[9] || '',
      createdAt: row[0] || '',
    }));

    // Range 1: PROFIL_PEGAWAI
    const profileRows = valueRanges[1]?.values || [];
    let profile: UserProfile | null = null;
    if (profileRows.length > 0 && profileRows[0][0]) {
      const r = profileRows[0];
      profile = {
        nama: r[0] || '',
        nip: r[1] || '',
        jabatan: r[2] || '',
        unitKerja: r[3] || '',
        namaAtasan: r[4] || '',
        nipAtasan: r[5] || '',
        jabatanAtasan: r[6] || '',
        kota: r[7] || '',
      };
    }

    // Range 2: TEMPLAT_RUTIN
    const templateRows = valueRanges[2]?.values || [];
    let templates: RoutineTemplate[] | null = null;
    if (templateRows.length > 0) {
      templates = templateRows.map((row: string[]): RoutineTemplate => ({
        id: row[0] || `tmpl-${Math.random()}`,
        nama: row[1] || '',
        uraian: row[2] || '',
        outputDefault: row[3] || '',
        tipeJam: (row[4] as 'fixed' | 'day_dependent') || 'fixed',
        jamDefault: row[5] || '08.00',
        jamJumatSabtu: row[6] || '',
      }));
    }

    return { reports, profile, templates, rateLimited: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      console.warn('Google Sheets API Quota (429). Menggunakan cache lokal.');
      return { reports: null, profile: null, templates: null, rateLimited: true };
    }
    throw err;
  }
};

// 4. Batch Add Reports to Sheets (SINGLE APPEND REQUEST)
export const addBatchReportsToSheets = async (
  token: string,
  spreadsheetId: string,
  newReports: ReportItem[]
): Promise<void> => {
  if (newReports.length === 0) return;

  const values = newReports.map((report) => [
    report.id,
    report.tanggal,
    report.jamMulai,
    report.uraian,
    report.output,
    report.fotoUrl || '',
    report.fotoId || '',
    report.docUrl || '',
    report.docId || '',
    report.docName || '',
  ]);

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LAPORAN_HARIAN!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (res.status === 429) {
      console.warn('Google Sheets API rate limit (429) pada penambahan laporan. Data telah tersimpan di cache lokal.');
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Google Sheets API quota exceeded. Data tersimpan di cache lokal.');
        return;
      }
      throw new Error(`Gagal menyimpan laporan ke Google Sheets: ${errText}`);
    }
  } catch (err) {
    console.warn('Sinkronisasi batch ke Sheets tertunda:', err);
  }
};

// 5. Upload File to Google Drive Folder
export const uploadFileToDrive = async (
  token: string,
  folderId: string,
  file: File,
  customName?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> => {
  const metadata = {
    name: customName || file.name,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const fileBuffer = await file.arrayBuffer();
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const blob = new Blob([metadataPart, fileBuffer, closeDelim]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: blob,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Gagal mengunggah file ke Google Drive: ${err}`);
  }

  const uploadData: DriveFile = await uploadRes.json();

  // Try to make file viewable with link so preview images can load
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch {
    // Non-fatal if organization restricts sharing
  }

  return {
    fileId: uploadData.id,
    webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
    webContentLink: uploadData.webContentLink || `https://drive.google.com/uc?export=download&id=${uploadData.id}`,
  };
};

// 6. User Profile Operations (with 429 graceful catch)
export const saveProfileToSheets = async (
  token: string,
  spreadsheetId: string,
  profile: UserProfile
): Promise<void> => {
  const values = [
    [
      profile.nama,
      profile.nip,
      profile.jabatan,
      profile.unitKerja,
      profile.namaAtasan,
      profile.nipAtasan,
      profile.jabatanAtasan,
      profile.kota,
    ],
  ];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PROFIL_PEGAWAI!A2:H2?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (res.status === 429) {
      console.warn('Google Sheets API rate limit (429) pada profil. Data tersimpan di cache lokal.');
      return;
    }

    if (!res.ok) {
      const err = await res.text();
      if (err.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Google Sheets API quota pada profil. Tersimpan di cache lokal.');
        return;
      }
      throw new Error(`Gagal menyimpan profil ke Google Sheets: ${err}`);
    }
  } catch (err) {
    console.warn('Sinkronisasi profil tertunda:', err);
  }
};

// 7. Single Daily Report Operations (with 429 graceful catch)
export const addReportToSheets = async (
  token: string,
  spreadsheetId: string,
  report: ReportItem
): Promise<void> => {
  await addBatchReportsToSheets(token, spreadsheetId, [report]);
};

export const updateReportInSheets = async (
  token: string,
  spreadsheetId: string,
  report: ReportItem
): Promise<void> => {
  try {
    const fetchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LAPORAN_HARIAN!A:A`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (fetchRes.status === 429) {
      console.warn('Rate limit (429) saat update laporan. Data tersimpan di cache lokal.');
      return;
    }

    if (!fetchRes.ok) return;

    const idColData = await fetchRes.json();
    const rows: string[][] = idColData.values || [];
    const rowIndex = rows.findIndex((r) => r[0] === report.id);

    if (rowIndex === -1) return;

    const sheetRowNum = rowIndex + 1;
    const values = [
      [
        report.id,
        report.tanggal,
        report.jamMulai,
        report.uraian,
        report.output,
        report.fotoUrl || '',
        report.fotoId || '',
        report.docUrl || '',
        report.docId || '',
        report.docName || '',
      ],
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LAPORAN_HARIAN!A${sheetRowNum}:J${sheetRowNum}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  } catch (err) {
    console.warn('Update laporan ke Sheets tertunda:', err);
  }
};

export const deleteReportFromSheets = async (
  token: string,
  spreadsheetId: string,
  reportId: string
): Promise<void> => {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const targetSheet = meta.sheets?.find(
      (s: { properties: { title: string } }) => s.properties.title === 'LAPORAN_HARIAN'
    );
    if (!targetSheet) return;
    const harianSheetId = targetSheet.properties.sheetId;

    const fetchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LAPORAN_HARIAN!A:A`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!fetchRes.ok) return;
    const idColData = await fetchRes.json();
    const rows: string[][] = idColData.values || [];
    const rowIndex = rows.findIndex((r) => r[0] === reportId);

    if (rowIndex === -1) return;

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: harianSheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        }),
      }
    );
  } catch (err) {
    console.warn('Hapus baris di Sheets tertunda:', err);
  }
};

// 8. Routine Templates Operations (with 429 graceful catch)
export const saveTemplatesToSheets = async (
  token: string,
  spreadsheetId: string,
  templates: RoutineTemplate[]
): Promise<void> => {
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/TEMPLAT_RUTIN!A2:G100:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const values = templates.map((t) => [
      t.id,
      t.nama,
      t.uraian,
      t.outputDefault,
      t.tipeJam,
      t.jamDefault,
      t.jamJumatSabtu || '',
    ]);

    if (values.length === 0) return;

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/TEMPLAT_RUTIN!A2:G${
        values.length + 1
      }?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  } catch (err) {
    console.warn('Simpan templat ke Sheets tertunda:', err);
  }
};
