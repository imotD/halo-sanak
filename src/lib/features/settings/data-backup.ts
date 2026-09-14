import { getDB } from '$lib/db';
import { ExportFileSchema, type ExportFile } from '$lib/schemas';
import { stripReactivity } from '$lib/utils/clone';

/**
 * Mengunduh seluruh data dalam format JSON: halosanak-<YYYY-MM-DD>.json (PRD §8.5)
 */
export async function exportDatabaseToJSON(): Promise<{ filename: string; memberCount: number }> {
	const db = getDB();
	const members = await db.members.toArray();
	const relationships = await db.relationships.toArray();

	const dateStr = new Date().toISOString().split('T')[0];
	const filename = `halosanak-${dateStr}.json`;

	const payload: ExportFile = {
		app: 'halosanak',
		version: 1,
		exportedAt: new Date().toISOString(),
		members,
		relationships
	};

	// Validasi sebelum export
	const validated = ExportFileSchema.parse(payload);
	const jsonString = JSON.stringify(validated, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);

	return { filename, memberCount: members.length };
}

/**
 * Membaca dan memvalidasi file JSON cadangan tanpa menyentuh data lama.
 * Menghasilkan data terurai jika valid, atau melempar Error jika skema rusak (PRD §8.5).
 */
export async function parseAndValidateBackupFile(file: File): Promise<ExportFile> {
	const text = await file.text();
	let parsedJson: unknown;
	try {
		parsedJson = JSON.parse(text);
	} catch {
		throw new Error('Format file bukan JSON yang valid.');
	}

	const parseResult = ExportFileSchema.safeParse(parsedJson);
	if (!parseResult.success) {
		const firstErr = parseResult.error.issues[0]?.message || 'Struktur data tidak sesuai skema HaloSanak.';
		throw new Error(`Validasi gagal: ${firstErr}`);
	}

	return parseResult.data;
}

/**
 * Mengganti seluruh isi database lokal dengan snapshot hasil import (Destruktif, atomik).
 */
export async function replaceDatabaseWithSnapshot(snapshot: ExportFile): Promise<number> {
	const db = getDB();

	// Bersihkan seluruh Svelte 5 reactive proxy dan field undefined agar aman di IndexedDB Structured Clone
	const cleanMembers = stripReactivity(snapshot.members);
	const cleanRelationships = stripReactivity(snapshot.relationships);

	await db.transaction('rw', db.members, db.relationships, async () => {
		// Hapus seluruh data lama
		await db.members.clear();
		await db.relationships.clear();

		// Masukkan data baru
		if (cleanMembers.length > 0) {
			await db.members.bulkAdd(cleanMembers);
		}
		if (cleanRelationships.length > 0) {
			await db.relationships.bulkAdd(cleanRelationships);
		}
	});

	return cleanMembers.length;
}

/**
 * Menghapus seluruh data database lokal (Clear all).
 */
export async function clearAllLocalData(): Promise<void> {
	const db = getDB();
	await db.transaction('rw', db.members, db.relationships, async () => {
		await db.members.clear();
		await db.relationships.clear();
	});
}
