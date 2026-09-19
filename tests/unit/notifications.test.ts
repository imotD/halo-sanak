import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	isNotificationSupported,
	getNotificationPermissionStatus,
	isNotificationEnabled,
	setNotificationEnabled,
	notifyTodayEvents
} from '../../src/lib/services/notifications';
import type { UpcomingEvent } from '../../src/lib/domain/reminders';

describe('Notification Service Unit Tests (PRD v2 §2.1)', () => {
	afterEach(() => vi.unstubAllGlobals());

	const event = (): UpcomingEvent => ({ memberId: crypto.randomUUID(), memberName: 'Andi', gender: 'Laki-laki', type: 'birthday', date: new Date(), dateFormatted: 'Hari ini', daysRemaining: 0, label: 'Ulang tahun' });

	it('deduplicates concurrent async sends and persists only successful delivery', async () => {
		let release!: () => void;
		const showNotification = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
		const notification = vi.fn();
		Object.assign(notification, { permission: 'granted' });
		vi.stubGlobal('Notification', notification);
		vi.stubGlobal('window', { Notification: notification });
		vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ showNotification }) } });
		setNotificationEnabled(true);
		const today = event();
		const first = notifyTodayEvents([today]);
		await vi.waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
		await notifyTodayEvents([today]);
		expect(localStorage.getItem('halosanak_last_notified_dates') ?? '{}').not.toContain(today.memberId);
		release();
		await first;
		await notifyTodayEvents([today]);
		expect(showNotification).toHaveBeenCalledTimes(1);
		expect(notification).not.toHaveBeenCalled();
		expect(localStorage.getItem('halosanak_last_notified_dates')).toContain(today.memberId);
	});

	it('retries failed delivery and reports preference storage failure', async () => {
		const showNotification = vi.fn().mockRejectedValue(new Error('failed'));
		class NotificationStub {
			static permission = 'granted';
			constructor() { throw new Error('unsupported constructor'); }
		}
		vi.stubGlobal('Notification', NotificationStub);
		vi.stubGlobal('window', { Notification: NotificationStub });
		vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ showNotification }) } });
		setNotificationEnabled(true);
		const today = event();
		await notifyTodayEvents([today]);
		expect(localStorage.getItem('halosanak_last_notified_dates')).not.toContain(today.memberId);
		showNotification.mockResolvedValue(undefined);
		await notifyTodayEvents([today]);
		expect(showNotification).toHaveBeenCalledTimes(2);
		vi.stubGlobal('localStorage', { getItem: () => 'false', setItem: () => { throw new Error('quota'); } });
		expect(setNotificationEnabled(true)).toBe(false);
		expect(isNotificationEnabled()).toBe(false);
	});
	beforeEach(() => {
		// Mock localStorage in node env
		const store: Record<string, string> = {};
		vi.stubGlobal('localStorage', {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => {
				store[k] = v;
			},
			removeItem: (k: string) => {
				delete store[k];
			},
			clear: () => {
				for (const k in store) delete store[k];
			}
		});
	});

	it('mengelola preferensi enabled/disabled di localStorage', () => {
		// Panggil fungsi service secara nyata
		expect(setNotificationEnabled(true)).toBe(true);
		expect(isNotificationEnabled()).toBe(true);

		expect(setNotificationEnabled(false)).toBe(true);
		expect(isNotificationEnabled()).toBe(false);
	});

	it('notifyTodayEvents resolves safely bila dipanggil tanpa browser support', async () => {
		const sampleEvent: UpcomingEvent = {
			memberId: 'm1',
			memberName: 'Andi',
			gender: 'Laki-laki',
			type: 'birthday',
			date: new Date(),
			dateFormatted: '17 September',
			daysRemaining: 0,
			label: 'Ulang tahun ke-30 hari ini'
		};

		await expect(notifyTodayEvents([sampleEvent])).resolves.toBeUndefined();
	});
});
