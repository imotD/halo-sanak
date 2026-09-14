import { describe, it, expect } from 'vitest';
import { canDeleteMember, createSymmetricSpousePairs } from '../../src/lib/domain/relations';
import type { Relationship } from '../../src/lib/schemas';

describe('relations domain', () => {
	it('membuat pasangan simetris 2-arah (A-B dan B-A)', () => {
		let callCount = 0;
		const mockIdGen = () => `mock-id-${++callCount}`;
		const [edgeAB, edgeBA] = createSymmetricSpousePairs('member-1', 'member-2', mockIdGen);

		expect(edgeAB.id).toBe('mock-id-1');
		expect(edgeAB.fromMemberId).toBe('member-1');
		expect(edgeAB.toMemberId).toBe('member-2');
		expect(edgeAB.type).toBe('spouse');

		expect(edgeBA.id).toBe('mock-id-2');
		expect(edgeBA.fromMemberId).toBe('member-2');
		expect(edgeBA.toMemberId).toBe('member-1');
		expect(edgeBA.type).toBe('spouse');
	});

	it('canDeleteMember mengizinkan hapus hanya jika tidak ada relasi', () => {
		const noRel = canDeleteMember('member-1', []);
		expect(noRel.allowed).toBe(true);
		expect(noRel.blockingRelationships).toHaveLength(0);

		const activeRels: Relationship[] = [
			{
				id: 'r1',
				type: 'spouse',
				fromMemberId: 'member-1',
				toMemberId: 'member-2',
				createdAt: 1234
			}
		];
		const withRel = canDeleteMember('member-1', activeRels);
		expect(withRel.allowed).toBe(false);
		expect(withRel.blockingRelationships).toHaveLength(1);
	});
});
