# Penyesuaian Format Dokumen Ekspor Laporan Kinerja ASN PPPK

Menata ulang tata letak tabel pada dokumen ekspor Word (.docx), pratinjau HTML, dan tampilan cetak agar informasi **Hari/Tanggal** dipindahkan dari kolom kedua tabel menjadi judul penanggalan mandiri di bagian **atas kiri masing-masing tabel harian**, sesuai persis dengan format resmi pada tangkapan layar (screenshot).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan tangkapan layar yang dilampirkan pengguna:
> 1. **Penempatan Hari/Tanggal**: Judul `Hari/tanggal : [Nama Hari, Tanggal Bulan Tahun]` dicantumkan tepat di atas kiri setiap tabel kegiatan harian (misal: *Hari/tanggal : Selasa, 13 Oktober 2026*).
> 2. **Struktur Kolom Tabel Ekspor Word (.docx)**:
>    - Kolom **Hari/Tanggal** dihilangkan dari dalam tabel.
>    - Struktur kolom tabel menjadi 3 kolom: **No** (lebar ~8%), **Jam Mulai** (lebar ~16%), dan **Uraian Kegiatan / Pekerjaan** (lebar ~76%).
>    - Penomoran (**No**) dimulai ulang dari 1 pada setiap hari/tanggal.
> 3. **Pengelompokan Kegiatan per Tanggal**: Jika terdapat beberapa tanggal dalam satu periode laporan (misal laporan bulanan), kegiatan otomatis dikelompokkan secara kronologis per hari, dengan masing-masing tabel kegiatan tersendiri di bawah judul hari/tanggal yang bersangkutan.
> 4. **Pratinjau Layar & Pratinjau HTML**: Mengikuti tata letak yang sama persis agar tampilan di layar web selaras dengan hasil unduhan dokumen Word.

---

## 1. Overview & Core Concept

- **Tujuan**: Menghasilkan dokumen laporan kinerja ASN PPPK Tenaga Teknis yang lebih rapi, terstruktur, dan elegan, di mana tanggal kegiatan tidak lagi berulang di setiap baris tabel, melainkan menjadi sub-judul hari/tanggal di atas tabel kegiatan hari tersebut.
- **Sasaran Pengguna**: Pegawai PPPK Tenaga Teknis yang menyusun dan mencetak lembar laporan kinerja harian/bulanan untuk disahkan oleh Atasan Langsung / Kepala Instansi.

---

## 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAPORAN KINERJA HARIAN PEGAWAI PEMERINTAH DENGAN PERJANJIAN KERJA (PPPK)│
│ TENAGA TEKNIS                                                          │
│ PERIODE: BULAN OKTOBER TAHUN 2026                                      │
├────────────────────────────────────────────────────────────────────────┤
│ Nama Pegawai        : Agus Nurcahya                                    │
│ NIP PPPK            : 199708172025211040                               │
│ Jabatan             : Operator Layanan Operasional                     │
│ Unit Kerja / Instansi: SDN Cabak                                       │
│ Atasan Langsung     : Very Suhardiono, S.Pd. (Kepala Sekolah)          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ Hari/tanggal : Selasa, 13 Oktober 2026                                 │
│ ┌────┬───────────┬───────────────────────────────────────────────────┐ │
│ │ No │ Jam Mulai │ Uraian Kegiatan / Pekerjaan                       │ │
│ ├────┼───────────┼───────────────────────────────────────────────────┤ │
│ │ 1  │ 06.15     │ Menyapu dan membersihkan area halaman, selasar... │ │
│ │ 2  │ 07.30     │ Menyiram taman                                    │ │
│ │ 3  │ 08.00     │ Membersihkan, menyikat lantai dan kloset...       │ │
│ │ 4  │ 11.10     │ Melaksanakan pengamanan gerbang masuk...          │ │
│ └────┴───────────┴───────────────────────────────────────────────────┘ │
│                                                                        │
│ Hari/tanggal : Rabu, 14 Oktober 2026                                   │
│ ┌────┬───────────┬───────────────────────────────────────────────────┐ │
│ │ No │ Jam Mulai │ Uraian Kegiatan / Pekerjaan                       │ │
│ ├────┼───────────┼───────────────────────────────────────────────────┤ │
│ │ 1  │ 06.15     │ Menyapu dan membersihkan area halaman...          │ │
│ │ 2  │ 08.00     │ Membersihkan, menyikat lantai dan kloset...       │ │
│ └────┴───────────┴───────────────────────────────────────────────────┘ │
│                                                                        │
│ [Mengetahui Atasan]                     [Kota, Tanggal - Pegawai PPPK] │
└────────────────────────────────────────────────────────────────────────┘
```

- **Tipografi & Spasi**:
  - Judul `Hari/tanggal : [Hari], [Tanggal] [Bulan] [Tahun]` menggunakan ukuran teks yang jelas (11pt / semi-bold / underlined bila perlu).
  - Terdapat jarak vertikal yang proporsional (*spacing*) antara tabel hari sebelumnya dengan judul hari berikutnya.
- **Paginasi & Page Break**: Ditambahkan aturan `keepLines` / `cantSplit` agar tabel hari dan pengesahan tidak terpotong canggung saat dicetak atau diubah menjadi PDF.

---

## 3. Key Product Decisions & Trade-Offs

- **Pengelompokan Data (Date Grouping Utility)**:
  - Mengelompokkan `ReportItem[]` ke dalam format Map berurutan berdasarkan tanggal unik (`Map<string, ReportItem[]>`).
  - Menjaga urutan tanggal secara kronologis (tanggal terlama ke tanggal terbaru) dan jam mulai di setiap tanggal (jam pagi ke siang).
- **Format Word (.docx)**:
  - Mengubah fungsi `exportLaporanToDocx` pada `src/utils/docxExport.ts` agar untuk setiap tanggal, dibuat paragraf judul `Hari/tanggal : ...` diikuti tabel kegiatan 3 kolom (`No`, `Jam Mulai`, `Uraian Kegiatan / Pekerjaan`).
- **Format HTML Report & Print Preview**:
  - Mengubah generator string `src/utils/htmlReportGenerator.ts` dan komponen pratinjau `src/components/PrintReportView.tsx` agar menyajikan pengelompokan tabel harian yang identik dengan output Word.

---

## 4. Rencana Implementasi

1. **Modifikasi `src/utils/docxExport.ts`**:
   - Tambahkan fungsi helper untuk mengelompokkan laporan berdasarkan tanggal.
   - Buat elemen judul `Hari/tanggal : ...` dan tabel harian dengan 3 kolom.
   - Sambungkan ke generator file `.docx`.

2. **Modifikasi `src/utils/htmlReportGenerator.ts`**:
   - Perbarui template HTML untuk merender grup tabel per tanggal dengan header `Hari/tanggal : ...` di atas kiri setiap tabel.
   - Kolom tabel HTML: No, Jam Mulai, Uraian Kegiatan, Hasil/Output, dan Dokumentasi/Foto (pada kolom kanan).

3. **Modifikasi `src/components/PrintReportView.tsx`**:
   - Perbarui pratinjau langsung di dalam aplikasi agar mencerminkan format tabel per tanggal yang baru sebelum pengguna mengunduh atau mencetak.

4. **Verifikasi & Build**:
   - Jalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada kesalahan tipe data TypeScript atau sintaks.
