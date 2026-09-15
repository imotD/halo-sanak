export const UI_STRINGS = {
	appName: 'HaloSanak',
	tagline: 'Pohon Keluarga Besar',
	nav: {
		tree: 'Pohon',
		members: 'Anggota',
		add: 'Tambah',
		settings: 'Pengaturan'
	},
	common: {
		save: 'Simpan',
		cancel: 'Batal',
		delete: 'Hapus',
		edit: 'Edit',
		back: 'Kembali',
		loading: 'Memproses...',
		close: 'Tutup',
		detail: 'Detail Anggota'
	},
	member: {
		fullName: 'Nama Lengkap',
		gender: 'Jenis Kelamin',
		male: 'Laki-laki',
		female: 'Perempuan',
		domicile: 'Domisili',
		birthDate: 'Tanggal Lahir',
		isDeceased: 'Sudah Wafat',
		deathDate: 'Tanggal Wafat',
		occupation: 'Pekerjaan',
		description: 'Deskripsi',
		photo: 'Foto Profil',
		age: 'Usia',
		yearsOld: 'tahun',
		deceasedBadge: 'Sudah wafat'
	},
	relations: {
		father: 'Ayah',
		mother: 'Ibu',
		spouse: 'Pasangan',
		children: 'Anak',
		noRelations: 'Belum ada relasi terhubung'
	},
	settings: {
		exportJSON: 'Export JSON',
		importJSON: 'Import JSON',
		clearAll: 'Hapus Semua Data',
		confirmClearTitle: 'Hapus Semua Data?',
		confirmClearWarning: 'Tindakan ini akan menghapus seluruh data lokal secara permanen.'
	},
	errors: {
		cycleDetected: 'Relasi ditolak: terdeteksi siklus leluhur.',
		cannotDeleteWithRelations: 'Anggota tidak dapat dihapus karena masih memiliki relasi aktif.',
		importFailed: 'File tidak valid atau format rusak.'
	},
	success: {
		saved: 'Data berhasil disimpan',
		exported: 'Data berhasil diexport',
		imported: 'Data berhasil diimport',
		deleted: 'Data berhasil dihapus'
	}
} as const;
