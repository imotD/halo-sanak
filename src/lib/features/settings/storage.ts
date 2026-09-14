/**
 * Meminta izin browser untuk persistent storage agar data IndexedDB tidak di-evict
 * saat disk space rendah (PRD §11).
 */
export async function requestPersistentStorage(): Promise<boolean> {
	if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
		try {
			const isPersisted = await navigator.storage.persist();
			return isPersisted;
		} catch {
			return false;
		}
	}
	return false;
}
