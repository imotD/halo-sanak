import { browser } from '$app/environment';
import type { UpcomingEvent } from '$lib/domain/reminders';

const STORAGE_KEY_NOTIF_ENABLED = 'halosanak_notif_enabled';
const STORAGE_KEY_LAST_NOTIFIED = 'halosanak_last_notified_dates';
const sending = new Set<string>();
const sent = new Set<string>();

/**
 * Format tanggal lokal YYYY-MM-DD (menghindari selisih UTC / WIB).
 */
export function getLocalDateString(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/**
 * Memeriksa apakah browser mendukung Notification API.
 */
export function isNotificationSupported(): boolean {
	if (!browser || typeof window === 'undefined') return false;
	return 'Notification' in window;
}

/**
 * Mendapatkan status izin notifikasi saat ini ('granted', 'denied', 'default', atau 'unsupported').
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
	if (!isNotificationSupported()) return 'unsupported';
	try {
		return Notification.permission;
	} catch {
		return 'unsupported';
	}
}

/**
 * Memeriksa preferensi pengguna apakah fitur notifikasi diaktifkan.
 */
export function isNotificationEnabled(): boolean {
	if (!browser) return false;
	try {
		if (typeof localStorage === 'undefined') return false;
		return localStorage.getItem(STORAGE_KEY_NOTIF_ENABLED) === 'true';
	} catch {
		return false;
	}
}

/**
 * Mengatur preferensi aktivasi notifikasi dengan penanganan storage error aman.
 */
export function setNotificationEnabled(enabled: boolean): boolean {
	if (!browser) return false;
	try {
		if (typeof localStorage === 'undefined') return false;
		localStorage.setItem(STORAGE_KEY_NOTIF_ENABLED, enabled ? 'true' : 'false');
		return true;
	} catch {
		return false;
	}
}

/**
 * Meminta izin notifikasi ke browser.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
	if (!isNotificationSupported()) return 'unsupported';
	try {
		const permission = await Notification.requestPermission();
		return permission;
	} catch {
		return 'denied';
	}
}

/**
 * Menampilkan notifikasi lokal: prioritas ServiceWorkerRegistration.showNotification() (PWA & mobile),
 * fallback ke new Notification() jika didukung desktop.
 */
export async function notifyTodayEvents(events: UpcomingEvent[], now: Date = new Date()): Promise<void> {
	if (!browser) return;
	if (!isNotificationSupported() || getNotificationPermissionStatus() !== 'granted' || !isNotificationEnabled()) {
		return;
	}

	const localDateStr = getLocalDateString(now);
	let notifiedMap: Record<string, string> = {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				notifiedMap = parsed;
			}
		}
	} catch {
		notifiedMap = {};
	}

	const todayEvents = events.filter((e) => {
		if (e.daysRemaining !== 0) return false;
		const eventDateStr = getLocalDateString(e.date);
		return eventDateStr === localDateStr;
	});
	if (todayEvents.length === 0) return;

	// Coba ambil service worker registration
	let swReg: ServiceWorkerRegistration | null = null;
	if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
		try {
			const reg = await navigator.serviceWorker.getRegistration();
			swReg = reg ?? null;
		} catch {
			swReg = null;
		}
	}

	for (const ev of todayEvents) {
		const eventKey = `${ev.type}_${ev.memberId}_${localDateStr}`;

		// Re-read storage untuk cegah race condition antar-tab
		try {
			const stored = localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					notifiedMap = { ...notifiedMap, ...parsed };
				}
			}
		} catch {
			// ignore storage error
		}

		if (notifiedMap[eventKey] || sending.has(eventKey) || sent.has(eventKey)) continue;
		if (!isNotificationEnabled() || getNotificationPermissionStatus() !== 'granted') return;
		sending.add(eventKey);

		const title = ev.type === 'birthday' ? `Ulang Tahun: ${ev.memberName}` : `Peringatan Wafat: ${ev.memberName}`;
		const body = ev.label;
		const icon = '/favicon.png';
		const tag = `halosanak_${eventKey}`;

		let notifiedSuccess = false;

		// 1. Coba lewat ServiceWorkerRegistration.showNotification() (diperlukan di Chrome Android & PWA)
		if (swReg && typeof swReg.showNotification === 'function') {
			try {
				await swReg.showNotification(title, {
					body,
					icon,
					tag
				});
				notifiedSuccess = true;
			} catch {
				notifiedSuccess = false;
			}
		}

		// 2. Fallback new Notification() untuk desktop browser yang mendukung constructor
		if (!notifiedSuccess) {
			try {
				new Notification(title, {
					body,
					icon,
					tag
				});
				notifiedSuccess = true;
			} catch {
				notifiedSuccess = false;
			}
		}

		sending.delete(eventKey);
		if (notifiedSuccess) {
			sent.add(eventKey);
			notifiedMap[eventKey] = localDateStr;
			try {
				localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, JSON.stringify(notifiedMap));
			} catch {
				// Ignore storage error
			}
		}
	}

	try {
		for (const key of sent) {
			if (key.endsWith(`_${localDateStr}`)) notifiedMap[key] = localDateStr;
		}
		localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, JSON.stringify(notifiedMap));
	} catch {
		// Ignore storage errors
	}
}
