import { test, expect } from '@playwright/test';

test.describe('HaloSanak E2E Suite', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('tampilan halaman utama memuat judul HaloSanak dan navigasi', async ({ page }) => {
		await expect(page.locator('header')).toContainText('HaloSanak');
		await expect(page.locator('nav')).toBeVisible();
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

	test('dapat beralih antara tab Anggota dan Pohon', async ({ page }) => {
		// Klik tab Anggota
		await page.locator('button:has-text("Anggota")').first().click();
		await expect(page.locator('input[placeholder*="Cari nama anggota"]')).toBeVisible();

		// Klik tab Pohon
		await page.locator('button:has-text("Pohon")').first().click();
		await expect(page.locator('svg[role="application"]')).toBeVisible();
	});
});
