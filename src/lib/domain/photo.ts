/**
 * Kompresi foto ke format WebP:
 * Target akhir: maks 400x400 px dan <= 100KB (102400 bytes).
 * Sesuai PRD §6: Bila gagal, return null agar penyimpanan profil tidak terblokir.
 */
export async function compressProfilePhoto(
	file: Blob | File,
	maxDim = 400,
	maxBytes = 100 * 1024
): Promise<string | null> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return null;
	}

	try {
		const bitmap = await createImageBitmap(file);
		let width = bitmap.width;
		let height = bitmap.height;

		// Hitung scale rasio mempertahankan aspect ratio
		if (width > maxDim || height > maxDim) {
			if (width > height) {
				height = Math.round((height * maxDim) / width);
				width = maxDim;
			} else {
				width = Math.round((width * maxDim) / height);
				height = maxDim;
			}
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;

		ctx.drawImage(bitmap, 0, 0, width, height);

		// Coba kompresi bertahap dari kualitas 0.85 turun jika melebihi 100KB
		let quality = 0.85;
		let dataUrl = canvas.toDataURL('image/webp', quality);

		// Perkiraan ukuran data URL base64 ke bytes
		const getByteLength = (str: string) => {
			const base64 = str.split(',')[1] || '';
			return Math.floor((base64.length * 3) / 4);
		};

		while (getByteLength(dataUrl) > maxBytes && quality > 0.2) {
			quality -= 0.15;
			dataUrl = canvas.toDataURL('image/webp', quality);
		}

		return dataUrl;
	} catch {
		// Non-blocking fallback
		return null;
	}
}
