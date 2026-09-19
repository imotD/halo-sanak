import { describe, it, expect } from 'vitest';
import type { Member, Relationship } from '../../src/lib/schemas';
import { calculateKinship, formatKinshipPath } from '../../src/lib/domain/kinship';
import { UI_STRINGS } from '../../src/lib/strings';

function makeMember(overrides: Partial<Member> & { id: string; fullName: string; gender: 'Laki-laki' | 'Perempuan' }): Member {
	return {
		domicile: 'Padang',
		isDeceased: false,
		createdAt: 1000,
		updatedAt: 1000,
		...overrides
	};
}

function makeParentChildRel(id: string, parentId: string, childId: string, role?: 'father' | 'mother'): Relationship {
	return {
		id,
		fromMemberId: parentId,
		toMemberId: childId,
		type: 'parent-child',
		role,
		createdAt: 1000
	};
}

function makeSpouseRel(id: string, aId: string, bId: string): Relationship {
	return {
		id,
		fromMemberId: aId,
		toMemberId: bId,
		type: 'spouse',
		createdAt: 1000
	};
}

describe('Kinship Engine Unit Tests (PRD v2 §1.3 - §1.6)', () => {
	it('mengembalikan diri sendiri jika A === B', () => {
		const a = makeMember({ id: 'm1', fullName: 'Andi', gender: 'Laki-laki' });
		const res = calculateKinship(a, a, [a], []);
		expect(res.term).toBe(UI_STRINGS.kinship.self);
		expect(res.depthA).toBe(0);
		expect(res.depthB).toBe(0);
	});

	it('mengembalikan notFound jika tidak ada leluhur bersama', () => {
		const a = makeMember({ id: 'm1', fullName: 'Andi', gender: 'Laki-laki' });
		const b = makeMember({ id: 'm2', fullName: 'Budi', gender: 'Laki-laki' });
		const res = calculateKinship(a, b, [a, b], []);
		expect(res.term).toBe(UI_STRINGS.kinship.notFound);
		expect(res.sentence).toBe(UI_STRINGS.kinship.notFound);
	});

	it('menghitung hubungan garis lurus: Orang Tua & Anak', () => {
		const father = makeMember({ id: 'f1', fullName: 'Ayah Rudi', gender: 'Laki-laki' });
		const child = makeMember({ id: 'c1', fullName: 'Andi', gender: 'Laki-laki' });
		const rels = [makeParentChildRel('r1', father.id, child.id, 'father')];

		// Dari sudut pandang Andi (A=child, B=father) -> B adalah Orang Tua bagi A
		const resParent = calculateKinship(child, father, [child, father], rels);
		expect(resParent.term).toBe(UI_STRINGS.kinship.parent);
		expect(resParent.depthA).toBe(1);
		expect(resParent.depthB).toBe(0);

		// Dari sudut pandang Ayah (A=father, B=child) -> B adalah Anak bagi A
		const resChild = calculateKinship(father, child, [father, child], rels);
		expect(resChild.term).toBe(UI_STRINGS.kinship.child);
		expect(resChild.depthA).toBe(0);
		expect(resChild.depthB).toBe(1);
	});

	it('menghitung hubungan garis lurus: Kakek / Nenek & Cucu sesuai gender B', () => {
		const grandPa = makeMember({ id: 'gp', fullName: 'Kakek Hasan', gender: 'Laki-laki' });
		const grandMa = makeMember({ id: 'gm', fullName: 'Nenek Siti', gender: 'Perempuan' });
		const father = makeMember({ id: 'f', fullName: 'Ayah Rudi', gender: 'Laki-laki' });
		const grandChild = makeMember({ id: 'gc', fullName: 'Andi', gender: 'Laki-laki' });

		const rels = [
			makeParentChildRel('r1', grandPa.id, father.id, 'father'),
			makeParentChildRel('r2', grandMa.id, father.id, 'mother'),
			makeParentChildRel('r3', father.id, grandChild.id, 'father')
		];

		// A = grandChild, B = grandPa -> Kakek
		const resPa = calculateKinship(grandChild, grandPa, [grandChild, grandPa, father], rels);
		expect(resPa.term).toBe(UI_STRINGS.kinship.grandfather);

		// A = grandChild, B = grandMa -> Nenek
		const resMa = calculateKinship(grandChild, grandMa, [grandChild, grandMa, father], rels);
		expect(resMa.term).toBe(UI_STRINGS.kinship.grandmother);

		// A = grandPa, B = grandChild -> Cucu
		const resCucu = calculateKinship(grandPa, grandChild, [grandPa, grandChild, father], rels);
		expect(resCucu.term).toBe(UI_STRINGS.kinship.grandchild);
	});

	it('menghitung hubungan garis lurus: Buyut & Cicit (3 generasi)', () => {
		const greatGrandPa = makeMember({ id: 'ggp', fullName: 'Buyut Somad', gender: 'Laki-laki' });
		const grandPa = makeMember({ id: 'gp', fullName: 'Kakek Hasan', gender: 'Laki-laki' });
		const father = makeMember({ id: 'f', fullName: 'Ayah Rudi', gender: 'Laki-laki' });
		const cicit = makeMember({ id: 'c', fullName: 'Andi', gender: 'Laki-laki' });

		const rels = [
			makeParentChildRel('r1', greatGrandPa.id, grandPa.id, 'father'),
			makeParentChildRel('r2', grandPa.id, father.id, 'father'),
			makeParentChildRel('r3', father.id, cicit.id, 'father')
		];

		const resBuyut = calculateKinship(cicit, greatGrandPa, [cicit, greatGrandPa], rels);
		expect(resBuyut.term).toBe(UI_STRINGS.kinship.greatGrandparent);

		const resCicit = calculateKinship(greatGrandPa, cicit, [greatGrandPa, cicit], rels);
		expect(resCicit.term).toBe(UI_STRINGS.kinship.greatGrandchild);
	});

	it('menghitung generasi 4+ dengan label generik', () => {
		const gen1 = makeMember({ id: 'g1', fullName: 'Leluhur 1', gender: 'Laki-laki' });
		const gen2 = makeMember({ id: 'g2', fullName: 'Leluhur 2', gender: 'Laki-laki' });
		const gen3 = makeMember({ id: 'g3', fullName: 'Leluhur 3', gender: 'Laki-laki' });
		const gen4 = makeMember({ id: 'g4', fullName: 'Leluhur 4', gender: 'Laki-laki' });
		const gen5 = makeMember({ id: 'g5', fullName: 'Keturunan 5', gender: 'Laki-laki' });

		const rels = [
			makeParentChildRel('r1', gen1.id, gen2.id),
			makeParentChildRel('r2', gen2.id, gen3.id),
			makeParentChildRel('r3', gen3.id, gen4.id),
			makeParentChildRel('r4', gen4.id, gen5.id)
		];

		const resAncest = calculateKinship(gen5, gen1, [gen5, gen1], rels);
		expect(resAncest.term).toBe('Leluhur generasi ke-4');

		const resDesc = calculateKinship(gen1, gen5, [gen1, gen5], rels);
		expect(resDesc.term).toBe('Keturunan generasi ke-4');
	});

	describe('Aturan Saudara (Kakak / Adik / Saudara Kandung / Saudara Tiri)', () => {
		const father = makeMember({ id: 'f', fullName: 'Ayah Rudi', gender: 'Laki-laki' });
		const mother = makeMember({ id: 'm', fullName: 'Ibu Siti', gender: 'Perempuan' });

		it('aturan 1: prioritas field birthOrder (Anak ke-berapa)', () => {
			const child1 = makeMember({ id: 'c1', fullName: 'Budi (Anak ke-1)', gender: 'Laki-laki', birthOrder: 1 });
			const child2 = makeMember({ id: 'c2', fullName: 'Andi (Anak ke-2)', gender: 'Laki-laki', birthOrder: 2 });
			const rels = [
				makeParentChildRel('r1', father.id, child1.id),
				makeParentChildRel('r2', father.id, child2.id)
			];

			// Dari sudut pandang Andi (A=child2, B=child1) -> Budi lebih kecil angkanya -> Kakak
			const resKakak = calculateKinship(child2, child1, [child2, child1, father], rels);
			expect(resKakak.term).toBe(UI_STRINGS.kinship.olderSibling);

			// Dari sudut pandang Budi (A=child1, B=child2) -> Andi lebih besar angkanya -> Adik
			const resAdik = calculateKinship(child1, child2, [child1, child2, father], rels);
			expect(resAdik.term).toBe(UI_STRINGS.kinship.youngerSibling);
		});

		it('aturan 2: tanggal lahir lengkap jika birthOrder tidak tersedia', () => {
			const older = makeMember({
				id: 'c1',
				fullName: 'Dewi',
				gender: 'Perempuan',
				birthDate: { precision: 'full', value: '1995-03-15' }
			});
			const younger = makeMember({
				id: 'c2',
				fullName: 'Doni',
				gender: 'Laki-laki',
				birthDate: { precision: 'full', value: '1998-11-20' }
			});
			const rels = [
				makeParentChildRel('r1', father.id, older.id),
				makeParentChildRel('r2', father.id, younger.id)
			];

			// Doni melihat Dewi -> Dewi lahir lebih dulu -> Kakak
			const res = calculateKinship(younger, older, [younger, older, father], rels);
			expect(res.term).toBe(UI_STRINGS.kinship.olderSibling);

			// Dewi melihat Doni -> Doni lahir kemudian -> Adik
			const res2 = calculateKinship(older, younger, [older, younger, father], rels);
			expect(res2.term).toBe(UI_STRINGS.kinship.youngerSibling);
		});

		it('aturan 3 fallback: Saudara Kandung jika berbagi 2 orang tua yang sama', () => {
			const c1 = makeMember({ id: 'c1', fullName: 'Anak Satu', gender: 'Laki-laki' });
			const c2 = makeMember({ id: 'c2', fullName: 'Anak Dua', gender: 'Perempuan' });
			const rels = [
				makeParentChildRel('r1', father.id, c1.id),
				makeParentChildRel('r2', mother.id, c1.id),
				makeParentChildRel('r3', father.id, c2.id),
				makeParentChildRel('r4', mother.id, c2.id)
			];

			const res = calculateKinship(c1, c2, [c1, c2, father, mother], rels);
			expect(res.term).toBe(UI_STRINGS.kinship.fullSibling);
		});

		it('aturan 3 fallback: Saudara Tiri jika hanya berbagi 1 orang tua yang sama', () => {
			const mother2 = makeMember({ id: 'm2', fullName: 'Ibu Kedua', gender: 'Perempuan' });
			const c1 = makeMember({ id: 'c1', fullName: 'Anak Ibu 1', gender: 'Laki-laki' });
			const c2 = makeMember({ id: 'c2', fullName: 'Anak Ibu 2', gender: 'Laki-laki' });
			const rels = [
				makeParentChildRel('r1', father.id, c1.id),
				makeParentChildRel('r2', mother.id, c1.id),
				makeParentChildRel('r3', father.id, c2.id),
				makeParentChildRel('r4', mother2.id, c2.id)
			];

			const res = calculateKinship(c1, c2, [c1, c2, father, mother, mother2], rels);
			expect(res.term).toBe(UI_STRINGS.kinship.halfSibling);
		});
	});

	describe('Hubungan Kolateral (Paman/Bibi, Keponakan, Sepupu, Sepupu Jauh)', () => {
		const grandPa = makeMember({ id: 'gp', fullName: 'Kakek', gender: 'Laki-laki' });
		const parentA = makeMember({ id: 'pa', fullName: 'Ayah A', gender: 'Laki-laki' });
		const uncleB = makeMember({ id: 'ub', fullName: 'Paman Budi', gender: 'Laki-laki' });
		const auntC = makeMember({ id: 'ac', fullName: 'Bibi Cindy', gender: 'Perempuan' });
		const childA = makeMember({ id: 'ca', fullName: 'Anak A', gender: 'Laki-laki' });
		const cousinD = makeMember({ id: 'cd', fullName: 'Sepupu Dodi', gender: 'Laki-laki' });

		const rels = [
			makeParentChildRel('r1', grandPa.id, parentA.id),
			makeParentChildRel('r2', grandPa.id, uncleB.id),
			makeParentChildRel('r3', grandPa.id, auntC.id),
			makeParentChildRel('r4', parentA.id, childA.id),
			makeParentChildRel('r5', uncleB.id, cousinD.id)
		];

		it('depthA=2, depthB=1: Paman atau Bibi sesuai gender B', () => {
			const resPaman = calculateKinship(childA, uncleB, [], rels);
			expect(resPaman.term).toBe(UI_STRINGS.kinship.uncle);

			const resBibi = calculateKinship(childA, auntC, [], rels);
			expect(resBibi.term).toBe(UI_STRINGS.kinship.aunt);
		});

		it('depthA=1, depthB=2: Keponakan', () => {
			const resKeponakan = calculateKinship(uncleB, childA, [], rels);
			expect(resKeponakan.term).toBe(UI_STRINGS.kinship.nephewNiece);
		});

		it('depthA=2, depthB=2: Sepupu', () => {
			const resSepupu = calculateKinship(childA, cousinD, [], rels);
			expect(resSepupu.term).toBe(UI_STRINGS.kinship.cousin);
		});

		it('depth n=m >= 3: Sepupu', () => {
			const greatGrandPa = makeMember({ id: 'ggp', fullName: 'Buyut', gender: 'Laki-laki' });
			const gp1 = makeMember({ id: 'gp1', fullName: 'Kakek 1', gender: 'Laki-laki' });
			const gp2 = makeMember({ id: 'gp2', fullName: 'Kakek 2', gender: 'Laki-laki' });
			const p1 = makeMember({ id: 'p1', fullName: 'Ortu 1', gender: 'Laki-laki' });
			const p2 = makeMember({ id: 'p2', fullName: 'Ortu 2', gender: 'Laki-laki' });
			const c1 = makeMember({ id: 'c1', fullName: 'Anak 1', gender: 'Laki-laki' });
			const c2 = makeMember({ id: 'c2', fullName: 'Anak 2', gender: 'Laki-laki' });

			const deepRels = [
				makeParentChildRel('r1', greatGrandPa.id, gp1.id),
				makeParentChildRel('r2', greatGrandPa.id, gp2.id),
				makeParentChildRel('r3', gp1.id, p1.id),
				makeParentChildRel('r4', gp2.id, p2.id),
				makeParentChildRel('r5', p1.id, c1.id),
				makeParentChildRel('r6', p2.id, c2.id)
			];

			const res = calculateKinship(c1, c2, [], deepRels);
			expect(res.depthA).toBe(3);
			expect(res.depthB).toBe(3);
			expect(res.term).toBe(UI_STRINGS.kinship.cousin);
		});

		it('depth n != m collateral lainnya: Sepupu Jauh', () => {
			// childA (depth 2 ke grandPa), anak dari cousinD -> cicit dari grandPa (depth 3)
			const childOfCousin = makeMember({ id: 'coc', fullName: 'Anak Sepupu', gender: 'Perempuan' });
			const deepRels = [...rels, makeParentChildRel('r6', cousinD.id, childOfCousin.id)];

			const res = calculateKinship(childA, childOfCousin, [], deepRels);
			expect(res.depthA).toBe(2);
			expect(res.depthB).toBe(3);
			expect(res.term).toBe(UI_STRINGS.kinship.distantCousin);
		});
	});

	it('relasi pasangan tidak menciptakan hubungan darah jika tanpa anak/leluhur', () => {
		const husband = makeMember({ id: 'h', fullName: 'Suami', gender: 'Laki-laki' });
		const wife = makeMember({ id: 'w', fullName: 'Istri', gender: 'Perempuan' });
		const rels = [
			makeSpouseRel('s1', husband.id, wife.id),
			makeSpouseRel('s2', wife.id, husband.id)
		];

		const res = calculateKinship(husband, wife, [husband, wife], rels);
		expect(res.term).toBe(UI_STRINGS.kinship.notFound);
	});

	describe('formatKinshipPath helper (PRD v2 §1.7)', () => {
		it('memformat rantai silsilah dengan benar untuk paman/keponakan', () => {
			const grandPa = makeMember({ id: 'gp', fullName: 'Kakek Hasan', gender: 'Laki-laki' });
			const father = makeMember({ id: 'fa', fullName: 'Ayah Rudi', gender: 'Laki-laki' });
			const uncle = makeMember({ id: 'un', fullName: 'Paman Budi', gender: 'Laki-laki' });
			const child = makeMember({ id: 'ch', fullName: 'Andi', gender: 'Laki-laki' });

			const rels = [
				makeParentChildRel('r1', grandPa.id, father.id, 'father'),
				makeParentChildRel('r2', grandPa.id, uncle.id, 'father'),
				makeParentChildRel('r3', father.id, child.id, 'father')
			];

			const members = [grandPa, father, uncle, child];
			const membersMap = new Map(members.map((m) => [m.id, m]));

			const resPaman = calculateKinship(child, uncle, members, rels);
			const pathStr = formatKinshipPath(resPaman, membersMap, rels);

			expect(pathStr).toBe('Andi → ayah: Ayah Rudi → ayah: Kakek Hasan ← ayah: Paman Budi');
		});

		it('mengembalikan string kosong jika tidak ada LCA', () => {
			const a = makeMember({ id: 'a', fullName: 'A', gender: 'Laki-laki' });
			const b = makeMember({ id: 'b', fullName: 'B', gender: 'Perempuan' });
			const res = calculateKinship(a, b, [a, b], []);
			const membersMap = new Map([
				[a.id, a],
				[b.id, b]
			]);
			const pathStr = formatKinshipPath(res, membersMap, []);
			expect(pathStr).toBe('');
		});
	});
});
