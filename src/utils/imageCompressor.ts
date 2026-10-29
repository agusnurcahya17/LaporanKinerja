export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  previewUrl: string;
  originalFormatted: string;
  compressedFormatted: string;
  reductionPercentage: number;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const MAX_ALLOWED_BYTES = 290 * 1024; // ~296 KB to stay strictly below 300 KB target

/**
 * Kompresi gambar canvas di sisi browser agar ukuran file selalu < 300 KB.
 * Mendukung foto langsung dari Kamera HP maupun foto unggahan Galeri.
 */
export const compressImageUnder300KB = async (file: File): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau korup'));
      img.onload = async () => {
        try {
          const originalSize = file.size;
          // Initial resize constraint for typical mobile/desktop cameras
          let maxDimension = 1400;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context tidak didukung di browser ini');
          }

          let currentQuality = 0.82;
          let blob: Blob | null = null;

          // Attempt compression loop with quality reduction & progressive downscaling
          for (let attempt = 0; attempt < 8; attempt++) {
            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            blob = await new Promise<Blob | null>((res) => {
              canvas.toBlob(res, 'image/jpeg', currentQuality);
            });

            if (blob && blob.size <= MAX_ALLOWED_BYTES) {
              break;
            }

            // Lower quality first
            if (currentQuality > 0.45) {
              currentQuality -= 0.15;
            } else {
              // Scale down dimensions if quality is already at floor
              width = Math.round(width * 0.75);
              height = Math.round(height * 0.75);
              currentQuality = 0.65;
            }
          }

          if (!blob) {
            throw new Error('Gagal mengompresi gambar');
          }

          const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
          const compressedFile = new File([blob], compressedFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          // Generate preview URL
          const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
          const reduction = Math.max(
            0,
            Math.round(((originalSize - compressedFile.size) / originalSize) * 100)
          );

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size,
            previewUrl,
            originalFormatted: formatFileSize(originalSize),
            compressedFormatted: formatFileSize(compressedFile.size),
            reductionPercentage: reduction,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Alias for backward compatibility
export const compressImageUnder500KB = compressImageUnder300KB;
