import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from 'docx';
import { UserProfile, ReportItem } from '../types';
import { NAMA_BULAN_INDONESIA, NAMA_HARI_INDONESIA } from './dateHelpers';

export { NAMA_BULAN_INDONESIA, NAMA_HARI_INDONESIA };

export const formatTanggalIndonesia = (dateStr: string): string => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const hari = NAMA_HARI_INDONESIA[d.getDay()] || '';
  const bulan = NAMA_BULAN_INDONESIA[month - 1] || '';
  return `${hari}, ${day} ${bulan} ${year}`;
};

export const formatTanggalRingkas = (dateStr: string): string => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const bulan = NAMA_BULAN_INDONESIA[month - 1] || '';
  return `${day} ${bulan} ${year}`;
};

export interface ExportDocxParams {
  mode: 'bulanan' | 'harian';
  profile: UserProfile;
  reports: ReportItem[];
  bulan?: number; // 1 - 12
  tahun?: number;
  tanggalHarian?: string; // YYYY-MM-DD
  tanggalCetak?: string; // YYYY-MM-DD
}

export const exportLaporanToDocx = async (params: ExportDocxParams) => {
  const {
    mode,
    profile,
    reports,
    bulan = new Date().getMonth() + 1,
    tahun = new Date().getFullYear(),
    tanggalHarian = new Date().toISOString().split('T')[0],
    tanggalCetak = new Date().toISOString().split('T')[0],
  } = params;

  const namaBulan = NAMA_BULAN_INDONESIA[bulan - 1] || '';
  const tanggalCetakFormatted = formatTanggalRingkas(tanggalCetak);
  const kotaFormatted = profile.kota ? profile.kota.trim() : 'Tempat';

  // Sort reports chronologically
  const sortedReports = [...reports].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const borderThin = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  // Profile Identity rows
  const profileTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: 'Nama Pegawai', bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: profile.nama || '-', size: 20 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: 'NIP PPPK', bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: profile.nip || '-', size: 20 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: 'Jabatan', bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: profile.jabatan || '-', size: 20 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: 'Unit Kerja / Instansi', bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: profile.unitKerja || '-', size: 20 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: 'Atasan Langsung', bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [new Paragraph({ children: [new TextRun({ text: ':', size: 20 })] })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${profile.namaAtasan || '-'} (${profile.jabatanAtasan || 'Atasan'})`,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Helper to build 3-column table per date group
  const createDayTable = (dayReports: ReportItem[]): Table => {
    const dayHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: borderThin,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'E2E8F0' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'No', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          borders: borderThin,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'E2E8F0' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Jam Mulai', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 76, type: WidthType.PERCENTAGE },
          borders: borderThin,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'E2E8F0' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Uraian Kegiatan / Pekerjaan', bold: true, size: 20 })],
            }),
          ],
        }),
      ],
    });

    const dayDataRows: TableRow[] = dayReports.map((item, index) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            borders: borderThin,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${index + 1}`, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            borders: borderThin,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: item.jamMulai || '-', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 76, type: WidthType.PERCENTAGE },
            borders: borderThin,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                children: [new TextRun({ text: item.uraian || '-', size: 20 })],
              }),
            ],
          }),
        ],
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderThin,
      rows: [dayHeaderRow, ...dayDataRows],
    });
  };

  // Group reports chronologically by date
  const groupedByDate = new Map<string, ReportItem[]>();
  sortedReports.forEach((item) => {
    const d = item.tanggal || '';
    if (!groupedByDate.has(d)) {
      groupedByDate.set(d, []);
    }
    groupedByDate.get(d)!.push(item);
  });

  // Construct elements for activities (Header per day + Table per day)
  const activitiesElements: (Paragraph | Table)[] = [];

  if (groupedByDate.size === 0) {
    activitiesElements.push(
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [
          new TextRun({
            text: 'Hari/tanggal : -',
            size: 20,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borderThin,
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: { size: 8, type: WidthType.PERCENTAGE },
                borders: borderThin,
                shading: { fill: 'E2E8F0' },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 16, type: WidthType.PERCENTAGE },
                borders: borderThin,
                shading: { fill: 'E2E8F0' },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jam Mulai', bold: true, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 76, type: WidthType.PERCENTAGE },
                borders: borderThin,
                shading: { fill: 'E2E8F0' },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Uraian Kegiatan / Pekerjaan', bold: true, size: 20 })] })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnSpan: 3,
                borders: borderThin,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Tidak ada data laporan kinerja pada periode ini.',
                        italics: true,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    groupedByDate.forEach((dayItems, dateKey) => {
      activitiesElements.push(
        new Paragraph({
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: `Hari/tanggal : ${formatTanggalIndonesia(dateKey)}`,
              size: 20,
            }),
          ],
        }),
        createDayTable(dayItems),
        new Paragraph({ text: '', spacing: { after: 100 } })
      );
    });
  }

  // Signature Block Table (Two Columns: Left = Atasan, Right = Pegawai PPPK)
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Mengetahui,', size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: profile.jabatanAtasan || 'Atasan Langsung',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              // Spacing for signature
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: profile.namaAtasan ? `(${profile.namaAtasan})` : '(............................................)',
                    bold: true,
                    underline: {},
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP. ${profile.nipAtasan || '.....................................'}`,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${kotaFormatted}, ${tanggalCetakFormatted}`,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Pegawai yang bersangkutan (PPPK)',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              // Spacing for signature
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: profile.nama ? `(${profile.nama})` : '(............................................)',
                    bold: true,
                    underline: {},
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP. ${profile.nip || '.....................................'}`,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const subtitle1 =
    mode === 'harian'
      ? 'LEMBAR PENGESAHAN KINERJA HARIAN - TENAGA TEKNIS'
      : 'TENAGA TEKNIS';
  const subtitle2 =
    mode === 'harian'
      ? `HARI / TANGGAL: ${formatTanggalIndonesia(tanggalHarian).toUpperCase()}`
      : `PERIODE: BULAN ${namaBulan.toUpperCase()} TAHUN ${tahun}`;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children: [
          // Kop Judul Laporan
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'LAPORAN KINERJA HARIAN PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA (PPPK)',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: subtitle1,
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: subtitle2,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }), // separator spacing

          // Identitas
          profileTable,
          new Paragraph({ text: '' }),

          // Tabel Kegiatan Kinerja per Hari/Tanggal
          ...activitiesElements,
          new Paragraph({ text: '' }),

          // Lembar Tanda Tangan
          signatureTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName =
    mode === 'harian'
      ? `Laporan_Kinerja_Harian_PPPK_${tanggalHarian}.docx`
      : `Laporan_Kinerja_PPPK_${namaBulan}_${tahun}.docx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
