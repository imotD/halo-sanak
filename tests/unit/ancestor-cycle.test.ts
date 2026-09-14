import { describe, it, expect } from 'vitest';
import { detectAncestorCycle } from '../../src/lib/domain/ancestor-cycle';
import type { Relationship } from '../../src/lib/schemas';

describe('detectAncestorCycle', () => {
	it('menolak relasi jika orang tua dan anak adalah id yang sama (self-link)', () => {
		const isCycle = detectAncestorCycle('A', 'A', []);
		expect(isCycle).toBe(true);
	});

	it('mengizinkan relasi sah tanpa siklus (A orang tua B)', () => {
		const isCycle = detectAncestorCycle('A', 'B', []);
		expect(isCycle).toBe(false);
	});

	it('mendeteksi siklus langsung: B sudah orang tua A, A ingin dijadikan orang tua B', () => {
		const rels: Relationship[] = [
			{
				id: '1',
				type: 'parent-child',
				fromMemberId: 'B',
				toMemberId: 'A',
				createdAt: 1000
			}
		];
		// A mencoba jadi orang tua B
		const isCycle = detectAncestorCycle('A', 'B', rels);
		expect(isCycle).toBe(true);
	});

	it('mendeteksi siklus bertingkat: C anak B, B anak A, A mencoba jadi anak C', () => {
		const rels: Relationship[] = [
			{
				id: '1',
				type: 'parent-child',
				fromMemberId: 'A',
				toMemberId: 'B',
				createdAt: 1000
			},
			{
				id: '2',
				type: 'parent-child',
				fromMemberId: 'B',
				toMemberId: 'C',
				createdAt: 1001
			}
		];
		// C mencoba jadi orang tua A
		const isCycle = detectAncestorCycle('C', 'A', rels);
		expect(isCycle).toBe(true);
	});
});
