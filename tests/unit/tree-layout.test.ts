import { describe, it, expect } from 'vitest';
import { calculateTreeLayout } from '../../src/lib/features/tree/tree-layout';
import type { Member, Relationship } from '../../src/lib/schemas';

describe('Tree Layout Calculation Unit Test', () => {
	it('menghasilkan layout kosong jika tidak ada anggota', () => {
		const result = calculateTreeLayout([], []);
		expect(result.nodes).toHaveLength(0);
		expect(result.edges).toHaveLength(0);
	});

	it('mengatur posisi generasi anak lebih tinggi dari orang tua', () => {
		const parent: Member = {
			id: 'p1',
			fullName: 'Orang Tua',
			gender: 'Laki-laki',
			domicile: 'Padang',
			isDeceased: false,
			createdAt: 1,
			updatedAt: 1
		};
		const child: Member = {
			id: 'c1',
			fullName: 'Anak',
			gender: 'Perempuan',
			domicile: 'Padang',
			isDeceased: false,
			createdAt: 2,
			updatedAt: 2
		};
		const rel: Relationship = {
			id: 'r1',
			type: 'parent-child',
			fromMemberId: 'p1',
			toMemberId: 'c1',
			role: 'father',
			createdAt: 2
		};

		const result = calculateTreeLayout([parent, child], [rel]);
		expect(result.nodes).toHaveLength(2);

		const parentNode = result.nodes.find((n) => n.member.id === 'p1');
		const childNode = result.nodes.find((n) => n.member.id === 'c1');

		expect(parentNode?.generation).toBe(0);
		expect(childNode?.generation).toBe(1);
		expect(childNode!.y).toBeGreaterThan(parentNode!.y);

		// Ada garis relasi
		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].type).toBe('parent-child');
	});

	it('menempatkan pasangan suami istri di generasi yang sama', () => {
		const husband: Member = {
			id: 'h1',
			fullName: 'Suami',
			gender: 'Laki-laki',
			domicile: 'Jakarta',
			isDeceased: false,
			createdAt: 1,
			updatedAt: 1
		};
		const wife: Member = {
			id: 'w1',
			fullName: 'Istri',
			gender: 'Perempuan',
			domicile: 'Jakarta',
			isDeceased: false,
			createdAt: 1,
			updatedAt: 1
		};
		const rels: Relationship[] = [
			{ id: 's1', type: 'spouse', fromMemberId: 'h1', toMemberId: 'w1', createdAt: 1 },
			{ id: 's2', type: 'spouse', fromMemberId: 'w1', toMemberId: 'h1', createdAt: 1 }
		];

		const result = calculateTreeLayout([husband, wife], rels);
		expect(result.nodes).toHaveLength(2);

		const husbandNode = result.nodes.find((n) => n.member.id === 'h1');
		const wifeNode = result.nodes.find((n) => n.member.id === 'w1');

		expect(husbandNode?.generation).toBe(wifeNode?.generation);
		expect(husbandNode?.y).toBe(wifeNode?.y);

		// Ada edge garis pasangan
		const spouseEdge = result.edges.find((e) => e.type === 'spouse');
		expect(spouseEdge).toBeDefined();
	});
});
