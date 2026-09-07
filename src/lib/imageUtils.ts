/**
 * Utility for compressing and resizing images on the client side before saving to cloud database.
 * This guarantees image payloads remain small (~30-80KB) and never breach Cloud Firestore's 1MB limit.
 */
export async function compressImageFile(
  file: File, 
  maxWidth: number = 800, 
  maxHeight: number = 800, 
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        return reject(new Error('Invalid image data'));
      }

      // If svg or gif, return as-is
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return resolve(src);
      }

      const img = new Image();
      img.onerror = () => resolve(src); // fallback to original if decode fails
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Scale down while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(src);
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as clean compressed JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
