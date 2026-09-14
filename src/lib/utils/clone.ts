/**
 * Menghapus Svelte 5 reactive proxy ($state/$derived) dan membersihkan field undefined
 * agar objek aman disimpan ke IndexedDB tanpa memicu DataCloneError.
 */
export function stripReactivity<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
