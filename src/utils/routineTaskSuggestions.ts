/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RoutineTaskPreset {
  keywords: string[];
  nama: string;
  uraian: string;
  outputDefault: string;
  jamDefault: string;
  tipeJam: 'fixed' | 'day_dependent';
  jamJumatSabtu?: string;
  kategori?: string;
}

export const ROUTINE_PRESETS: RoutineTaskPreset[] = [
  {
    keywords: ['sapu', 'halaman', 'lingkungan', 'daun', 'kebersihan pagi'],
    nama: 'Menyapu Halaman',
    uraian: 'Menyapu, membersihkan, dan merapikan area halaman, selasar, serta lingkungan kantor/sekolah dari sampah dan daun kering guna menciptakan lingkungan yang bersih dan nyaman.',
    outputDefault: '1 Kegiatan / Area Halaman Bersih',
    jamDefault: '06.15',
    tipeJam: 'fixed',
    kategori: 'Kebersihan',
  },
  {
    keywords: ['toilet', 'kamar mandi', 'wc', 'sanitasi', 'kloset', 'bak mandi'],
    nama: 'Membersihkan Kamar Mandi & Sanitasi',
    uraian: 'Membersihkan dan menyikat lantai serta kloset, menguras dan mengisi bak penampungan air, serta memastikan ketersediaan sabun dan higienitas kamar mandi staf maupun umum.',
    outputDefault: '1 Kegiatan / Sanitasi Bersih & Higienis',
    jamDefault: '08.00',
    tipeJam: 'fixed',
    kategori: 'Sanitasi',
  },
  {
    keywords: ['gerbang', 'pos', 'satpam', 'pintu masuk', 'sebrang', 'menyebrang', 'keamanan', 'jaga'],
    nama: 'Jaga Gerbang & Ketertiban',
    uraian: 'Melaksanakan pengamanan gerbang masuk, membantu menyeberangkan siswa/tamu kedinasan, mencatat buku tamu, serta memantau ketertiban saat jam masuk dan pulang.',
    outputDefault: '1 Kegiatan / Gerbang Aman & Tertib',
    jamDefault: '11.10',
    tipeJam: 'day_dependent',
    jamJumatSabtu: '10.30',
    kategori: 'Keamanan',
  },
  {
    keywords: ['siram', 'tanaman', 'taman', 'bunga', 'kebun', 'rumput'],
    nama: 'Menyiram Tanaman & Perawatan Taman',
    uraian: 'Melakukan penyiraman tanaman, mencabuti rumput liar, serta merawat tanaman hias dan pekarangan agar lingkungan kantor/sekolah tetap asri, hijau, dan terpelihara.',
    outputDefault: '1 Kegiatan / Taman Asri & Terawat',
    jamDefault: '07.00',
    tipeJam: 'fixed',
    kategori: 'Taman',
  },
  {
    keywords: ['buka', 'kunci', 'pintu', 'jendela', 'ruangan', 'gedung', 'tutup'],
    nama: 'Membuka dan Menutup Ruangan Kerja / Gedung',
    uraian: 'Membuka seluruh pintu ruangan kerja, ruang kelas, serta ventilasi/jendela pada pagi hari, dan memastikan seluruh ruangan terkunci aman pada akhir jam kerja.',
    outputDefault: '1 Kegiatan / Ruangan Terbuka & Terkunci Aman',
    jamDefault: '06.30',
    tipeJam: 'fixed',
    kategori: 'Sarpras',
  },
  {
    keywords: ['sampah', 'tps', 'tong sampah', 'tempat sampah', 'pembuangan'],
    nama: 'Mengangkut dan Membuang Sampah ke TPS',
    uraian: 'Mengumpulkan sampah dari tong sampah di setiap ruangan dan selasar, memilah sampah kering dan basah, serta mengangkutnya ke Tempat Pembuangan Sampah Sementara (TPS).',
    outputDefault: '1 Kegiatan / Sampah Terangkut Bersih',
    jamDefault: '09.30',
    tipeJam: 'fixed',
    kategori: 'Kebersihan',
  },
  {
    keywords: ['pel', 'lantai', 'selasar', 'koridor', 'keramik'],
    nama: 'Mengepel Lantai Selasar & Ruang Kerja',
    uraian: 'Mengepel lantai lorong selasar dan ruangan dengan cairan pembersih lantai guna menjaga kebersihan, kenyamanan, serta higienitas sarana kerja.',
    outputDefault: '1 Kegiatan / Lantai Bersih & Mengkilap',
    jamDefault: '07.15',
    tipeJam: 'fixed',
    kategori: 'Kebersihan',
  },
  {
    keywords: ['kaca', 'jendela', 'kusen', 'debu'],
    nama: 'Pembersihan Kaca Jendela & Ventilasi',
    uraian: 'Membersihkan debu dan kotoran pada kaca jendela, ventilasi udara, serta kusen ruangan menggunakan kain mikrofiber dan pembersih kaca secara berkala.',
    outputDefault: '1 Kegiatan / Kaca Bersih & Bening',
    jamDefault: '08.30',
    tipeJam: 'fixed',
    kategori: 'Kebersihan',
  },
  {
    keywords: ['rapat', 'pertemuan', 'aula', 'meja rapat', 'kursi'],
    nama: 'Menyiapkan Ruang Rapat / Pertemuan Kedinasan',
    uraian: 'Menata susunan meja, kursi, perangkat mikrofon/sound system, layar proyektor, serta memastikan kebersihan ruang rapat sebelum pelaksanaan pertemuan dinas.',
    outputDefault: '1 Kegiatan / Ruang Rapat Siap Digunakan',
    jamDefault: '08.45',
    tipeJam: 'fixed',
    kategori: 'Layanan',
  },
  {
    keywords: ['apel', 'upacara', 'bendera', 'tiang', 'sound', 'lapangan'],
    nama: 'Menyiapkan Sarana Upacara / Apel Pagi',
    uraian: 'Menyiapkan tiang dan tali bendera, sound system portabel, mikrofon, serta podium demi kelancaran dan ketertiban pelaksanaan upacara/apel pagi.',
    outputDefault: '1 Kegiatan / Sarana Apel Siap & Tertib',
    jamDefault: '06.45',
    tipeJam: 'fixed',
    kategori: 'Layanan',
  },
  {
    keywords: ['listrik', 'lampu', 'saklar', 'stop kontak', 'mcb', 'air', 'keran', 'pipa', 'pompa'],
    nama: 'Pengecekan Sarana Listrik, Air & Sarpras',
    uraian: 'Melakukan pemeriksaan rutin pada saklar lampu, instalasi stop kontak, pompa air, dan keran wastafel guna mencegah kerusakan dan memastikan fungsi sarana berjalan normal.',
    outputDefault: '1 Laporan / Sarpras Berfungsi Normal',
    jamDefault: '09.00',
    tipeJam: 'fixed',
    kategori: 'Sarpras',
  },
  {
    keywords: ['arsip', 'dokumen', 'surat', 'fotokopi', 'scan', 'scan berkas', 'map'],
    nama: 'Membantu Penggandaan & Pengarsipan Dokumen',
    uraian: 'Membantu pelaksanaan fotokopi, pemindaian (scanning) dokumen resmi dinas, serta mengelompokkan dan menyimpan berkas ke dalam ordner arsip kantor.',
    outputDefault: '1 Berkas / Dokumen Terarsip Rapi',
    jamDefault: '10.00',
    tipeJam: 'fixed',
    kategori: 'Administrasi',
  },
  {
    keywords: ['komputer', 'printer', 'cetak', 'tinta', 'kertas', 'jaringan', 'internet', 'wifi'],
    nama: 'Pengecekan Perangkat Komputer & Printer Dinas',
    uraian: 'Melakukan pengecekan kesiapan perangkat komputer, mengisi kertas dan tinta printer kantor, serta memastikan koneksi jaringan internet berfungsi stabil.',
    outputDefault: '1 Laporan / Perangkat IT Siap Pakai',
    jamDefault: '08.15',
    tipeJam: 'fixed',
    kategori: 'IT & Teknis',
  },
  {
    keywords: ['tamu', 'ekspedisi', 'antar surat', 'antar dokumen', 'kurir'],
    nama: 'Pelayanan Tamu & Distribusi Surat Masuk',
    uraian: 'Menyambut tamu dinas yang hadir, mengarahkan ke meja piket/pimpinan, serta mencatat dan mendistribusikan surat masuk ke unit kerja terkait.',
    outputDefault: '1 Kegiatan / Tamu Terlayani & Surat Terdokumentasi',
    jamDefault: '09.15',
    tipeJam: 'fixed',
    kategori: 'Layanan',
  },
  {
    keywords: ['inventaris', 'sarana', 'barang', 'gudang', 'cek fisik'],
    nama: 'Pengecekan dan Penataan Barang Inventaris',
    uraian: 'Melakukan pendataan fisik barang inventaris, merapikan penyimpanan barang di gudang sarana prasarana, serta mencatat barang yang memerlukan perbaikan.',
    outputDefault: '1 Laporan / Inventaris Tertata Rapi',
    jamDefault: '13.30',
    tipeJam: 'fixed',
    kategori: 'Sarpras',
  },
];

/**
 * Smart automatic generator: derives complete formal ASN PPPK Tenaga Teknis description,
 * default output, and default start time from user-entered Title.
 */
export const generateUraianFromJudul = (judul: string): {
  uraian: string;
  outputDefault: string;
  jamDefault: string;
  tipeJam: 'fixed' | 'day_dependent';
  jamJumatSabtu?: string;
  matchedPreset?: RoutineTaskPreset;
} => {
  const clean = judul.trim();
  if (!clean) {
    return {
      uraian: '',
      outputDefault: '1 Kegiatan',
      jamDefault: '07.30',
      tipeJam: 'fixed',
    };
  }

  const lower = clean.toLowerCase();

  // 1. Direct or keyword match against presets
  for (const preset of ROUTINE_PRESETS) {
    // Check if preset title is within input or input is within preset title
    if (lower.includes(preset.nama.toLowerCase()) || preset.nama.toLowerCase().includes(lower)) {
      return {
        uraian: preset.uraian,
        outputDefault: preset.outputDefault,
        jamDefault: preset.jamDefault,
        tipeJam: preset.tipeJam,
        jamJumatSabtu: preset.jamJumatSabtu,
        matchedPreset: preset,
      };
    }

    // Check keyword match
    for (const kw of preset.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return {
          uraian: preset.uraian,
          outputDefault: preset.outputDefault,
          jamDefault: preset.jamDefault,
          tipeJam: preset.tipeJam,
          jamJumatSabtu: preset.jamJumatSabtu,
          matchedPreset: preset,
        };
      }
    }
  }

  // 2. Intelligent grammatical fallback for any custom title:
  // Convert title into formal ASN PPPK task sentence structure
  let verbPrefix = 'Melaksanakan kegiatan';
  let processedTitle = clean;

  // If title starts with common verbs (e.g., "Menyapu", "Memperbaiki", "Merapikan", "Membuat", "Membantu")
  if (/^(melakukan|melaksanakan|mengerjakan)\s+/i.test(clean)) {
    verbPrefix = 'Melaksanakan kegiatan';
    processedTitle = clean.replace(/^(melakukan|melaksanakan|mengerjakan)\s+/i, '');
  } else if (/^(meng|mem|men|me|perbaikan|pengaturan|pembersihan)\b/i.test(clean)) {
    verbPrefix = 'Melaksanakan tugas';
  }

  // Determine likely output based on title
  let suggestedOutput = '1 Kegiatan';
  if (lower.includes('lapor') || lower.includes('rekap') || lower.includes('catat') || lower.includes('cek')) {
    suggestedOutput = '1 Laporan';
  } else if (lower.includes('arsip') || lower.includes('berkas') || lower.includes('surat')) {
    suggestedOutput = '1 Berkas';
  } else {
    suggestedOutput = `1 Kegiatan / Terlaksananya ${clean}`;
  }

  // Determine likely time based on keywords
  let suggestedTime = '07.30';
  if (lower.includes('pagi') || lower.includes('buka') || lower.includes('sapu') || lower.includes('apel')) {
    suggestedTime = '06.30';
  } else if (lower.includes('siang') || lower.includes('pulang') || lower.includes('tutup') || lower.includes('kunci')) {
    suggestedTime = '13.00';
  } else if (lower.includes('sore')) {
    suggestedTime = '15.30';
  } else if (lower.includes('malam')) {
    suggestedTime = '18.00';
  }

  const formalUraian = `${verbPrefix} ${processedTitle.toLowerCase()} secara tertib, cermat, dan bertanggung jawab untuk memastikan kelancaran operasional kerja dan pelayanan di lingkungan kerja.`;

  return {
    uraian: formalUraian,
    outputDefault: suggestedOutput,
    jamDefault: suggestedTime,
    tipeJam: 'fixed',
  };
};
