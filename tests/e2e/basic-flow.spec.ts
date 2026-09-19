import { test, expect } from '@playwright/test';

import { SAMPLE_FAMILY_SNAPSHOT } from '../../src/lib/features/settings/sample-data';

test.describe('HaloSanak E2E Suite', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('tampilan halaman utama memuat judul HaloSanak dan navigasi', async ({ page }) => {
		await expect(page.locator('header')).toContainText('HaloSanak');
		await expect(page.locator('nav:visible')).toBeVisible();
	});

	test('dapat membuka form tambah anggota dan membatalkan', async ({ page }) => {
		// Klik tombol tambah anggota
		const addBtn = page.locator('header button:has-text("+ Tambah")');
		if (await addBtn.isVisible()) {
			await addBtn.click();
		} else {
			// Mobile button
			await page.locator('button[aria-label="Tambah Anggota"]').click();
		}

		// Modal muncul
		await expect(page.locator('role=dialog')).toBeVisible();
		await expect(page.locator('role=dialog')).toContainText('Tambah Anggota');

		// Klik Batal
		await page.locator('role=dialog button:has-text("Batal")').click();
		await expect(page.locator('role=dialog')).not.toBeVisible();
	});

	test('birth order persists, nested modal restores focus, backup roundtrip works offline', async ({ page, context }) => {
		const add = page.locator('header button:has-text("+ Tambah")');
		await add.click();
		const form = page.getByRole('dialog', { name: 'Tambah Anggota' });
		await form.getByLabel('Nama Lengkap').fill('Anak Uji');
		await form.getByLabel('Domisili').fill('Padang');
		await form.getByLabel('Anak ke-berapa').fill('2');
		await form.getByRole('button', { name: 'Simpan', exact: true }).click();
		await expect(form).not.toBeVisible();
		await expect(add).toBeFocused();
		await page.getByRole('button', { name: /^Anggota/ }).filter({ visible: true }).click();
		await page.getByText('Anak Uji', { exact: true }).click();
		let detail = page.getByRole('dialog', { name: 'Detail Anggota' });
		await detail.getByRole('button', { name: 'Edit', exact: true }).click();
		await expect(page.getByLabel('Anak ke-berapa')).toHaveValue('2');
		await page.getByRole('button', { name: 'Batal', exact: true }).click();
		await page.getByText('Anak Uji', { exact: true }).click();
		detail = page.getByRole('dialog', { name: 'Detail Anggota' });
		const kinship = detail.getByRole('button', { name: 'Hitung Hubungan', exact: true });
		await kinship.click();
		await expect(page.getByRole('dialog', { name: 'Pilih Anggota Target' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(kinship).toBeFocused();
		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Pengaturan', exact: true }).filter({ visible: true }).click();
		await page.locator('input[accept=".json,application/json"]').evaluate((input: HTMLInputElement) => {
			const transfer = new DataTransfer();
			transfer.items.add(new File(['{broken'], 'broken.json', { type: 'application/json' }));
			input.files = transfer.files;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
		await expect(page.getByText('Format file bukan JSON yang valid.', { exact: true })).toBeVisible();
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Unduh Cadangan JSON' }).click();
		const download = await downloadPromise;
		const path = await download.path();
		expect(path).not.toBeNull();
		await page.locator('input[accept=".json,application/json"]').setInputFiles(path!);
		await page.getByRole('button', { name: 'Hapus & Ganti Data', exact: true }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.evaluate(async () => { await navigator.serviceWorker.ready; });
		await page.reload();
		await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
		await context.setOffline(true);
		await page.reload();
		await page.getByRole('button', { name: /^Anggota/ }).filter({ visible: true }).click();
		await expect(page.getByText('Anak Uji', { exact: true })).toBeVisible();
	});

	test('imported parent and child produce directional kinship and visible path', async ({ page }) => {
		const edge = SAMPLE_FAMILY_SNAPSHOT.relationships.find((rel) => rel.type === 'parent-child')!;
		const parent = SAMPLE_FAMILY_SNAPSHOT.members.find((member) => member.id === edge.fromMemberId)!;
		const child = SAMPLE_FAMILY_SNAPSHOT.members.find((member) => member.id === edge.toMemberId)!;
		await page.getByRole('button', { name: 'Pengaturan', exact: true }).filter({ visible: true }).click();
		await page.locator('input[accept=".json,application/json"]').evaluate((input: HTMLInputElement, snapshot) => {
			const transfer = new DataTransfer();
			transfer.items.add(new File([JSON.stringify(snapshot)], 'family.json', { type: 'application/json' }));
			input.files = transfer.files;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}, SAMPLE_FAMILY_SNAPSHOT);
		await page.getByRole('button', { name: 'Hapus & Ganti Data', exact: true }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.getByRole('button', { name: /^Anggota/ }).filter({ visible: true }).click();
		await page.getByText(parent.fullName, { exact: true }).click();
		await page.getByRole('button', { name: 'Hitung Hubungan', exact: true }).click();
		await page.getByPlaceholder('Cari nama anggota target...').fill(child.fullName);
		await page.getByRole('dialog', { name: 'Pilih Anggota Target' }).getByRole('button', { name: new RegExp(child.fullName) }).click();
		const result = page.getByRole('dialog', { name: 'Hitung Hubungan Kekerabatan' });
		await expect(result).toContainText(`${child.fullName} adalah Anak bagi ${parent.fullName}`);
		await result.getByRole('button', { name: 'Lihat jalur silsilah' }).click();
		await expect(result.getByRole('button', { name: 'Sembunyikan jalur silsilah' })).toHaveAttribute('aria-expanded', 'true');
		await page.keyboard.press('Tab');
		expect(await result.evaluate((element) => element.contains(document.activeElement))).toBe(true);
	});

	test('dapat beralih antara tab Anggota dan Pohon', async ({ page }) => {
		// Klik tab Anggota
		await page.locator('button:has-text("Anggota")').first().click();
		await expect(page.locator('input[placeholder*="Cari nama anggota"]')).toBeVisible();

		// Klik tab Pohon
		await page.locator('button:has-text("Pohon")').first().click();
		await expect(page.locator('svg[role="application"]')).toBeVisible();
	});
});
