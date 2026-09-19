import { describe, it, expect } from 'vitest';
import {
	calculateTreeLayout,
	buildElbowPath,
	buildBracketPath,
	CARD_WIDTH,
	HORIZONTAL_GAP
} from '../../src/lib/features/tree/tree-layout';
import type { Member, Relationship } from '../../src/lib/schemas';

const mkMember = (id: string, gender: 'Laki-laki' | 'Perempuan'): Member => ({
	id,
	fullName: id,
	gender,
	domicile: 'Padang',
	isDeceased: false,
	createdAt: 1,
	updatedAt: 1
});

let relIdCounter = 0;
function pcRel(parent: string, child: string, role: 'father' | 'mother'): Relationship {
	return {
		id: `pc${relIdCounter++}`,
		type: 'parent-child',
		fromMemberId: parent,
		toMemberId: child,
		role,
		createdAt: 1
	};
}
function spouseRel(a: string, b: string): Relationship[] {
	return [
		{ id: `sp${relIdCounter++}`, type: 'spouse', fromMemberId: a, toMemberId: b, createdAt: 1 },
		{ id: `sp${relIdCounter++}`, type: 'spouse', fromMemberId: b, toMemberId: a, createdAt: 1 }
	];
}

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

	it('menempatkan anak lebih dekat ke titik tengah kedua orang tuanya (kurangi persilangan garis)', () => {
		// Skenario: pasangan menikah masuk dari cabang berjauhan.
		// Musahar+Yarlis di kiri, Neni+Uweb di kanan. Ina (anak Musahar+Yarlis)
		// menikah dengan Tommy (anak Neni+Uweb). Shanum adalah anak Ina+Tommy.
		// Harapannya: Shanum tetap berada dekat rata-rata X kedua ortu-nya (Ina & Tommy),
		// bukan tersasar jauh ke ordering acak.
		const mk = (id: string, gender: 'Laki-laki' | 'Perempuan'): Member => ({
			id,
			fullName: id,
			gender,
			domicile: 'Padang',
			isDeceased: false,
			createdAt: 1,
			updatedAt: 1
		});

		const members: Member[] = [
			mk('musahar', 'Laki-laki'),
			mk('yarlis', 'Perempuan'),
			mk('neni', 'Perempuan'),
			mk('uweb', 'Laki-laki'),
			mk('ina', 'Perempuan'),
			mk('tommy', 'Laki-laki'),
			mk('shanum', 'Perempuan')
		];

		let relId = 0;
		const pc = (parent: string, child: string, role: 'father' | 'mother'): Relationship => ({
			id: `r${relId++}`,
			type: 'parent-child',
			fromMemberId: parent,
			toMemberId: child,
			role,
			createdAt: 1
		});
		const spouse = (a: string, b: string): Relationship[] => [
			{ id: `r${relId++}`, type: 'spouse', fromMemberId: a, toMemberId: b, createdAt: 1 },
			{ id: `r${relId++}`, type: 'spouse', fromMemberId: b, toMemberId: a, createdAt: 1 }
		];

		const relationships: Relationship[] = [
			...spouse('musahar', 'yarlis'),
			...spouse('neni', 'uweb'),
			...spouse('ina', 'tommy'),
			pc('musahar', 'ina', 'father'),
			pc('yarlis', 'ina', 'mother'),
			pc('uweb', 'tommy', 'father'),
			pc('neni', 'tommy', 'mother'),
			pc('ina', 'shanum', 'mother'),
			pc('tommy', 'shanum', 'father')
		];

		const result = calculateTreeLayout(members, relationships);
		const byId = new Map(result.nodes.map((n) => [n.member.id, n]));

		const inaX = byId.get('ina')!.x;
		const tommyX = byId.get('tommy')!.x;
		const shanumX = byId.get('shanum')!.x;
		const parentMidX = (inaX + tommyX) / 2;

		// Shanum harus dekat dengan titik tengah kedua ortu-nya, bukan lebih dari
		// satu lebar kartu (220px) menyimpang.
		expect(Math.abs(shanumX - parentMidX)).toBeLessThan(220);
	});
});

describe('buildElbowPath', () => {
	it('menghasilkan garis lurus vertikal jika anak persis di bawah ortu', () => {
		const path = buildElbowPath(100, 0, 100, 200);
		expect(path).toBe('M 100 0 L 100 200');
	});

	it('menghasilkan path siku dengan sudut membulat (perintah Q) jika X berbeda', () => {
		const path = buildElbowPath(100, 0, 300, 200);
		expect(path.startsWith('M 100 0')).toBe(true);
		expect(path).toContain('Q');
		expect(path.endsWith('L 300 200')).toBe(true);
	});
});

describe('buildBracketPath', () => {
	it('menghasilkan path dgn 2 garis turun terpisah + jembatan + batang ke anak', () => {
		const path = buildBracketPath(100, 500, 80, 300, 200);
		// 4 sub-path: drop dari ortu1, drop dari ortu2, jembatan horizontal, batang ke anak
		const moveCount = path.split('M').length - 1;
		expect(moveCount).toBe(4);
		expect(path).toContain('M 100 80 L 100');
		expect(path).toContain('M 500 80 L 500');
	});
});

describe('Poligami: suami dgn banyak istri', () => {
	it('menaruh suami di tengah ketika punya 2 istri, spy keduanya bersebelahan', () => {
		const members = [
			mkMember('budi', 'Laki-laki'),
			mkMember('cinta', 'Perempuan'),
			mkMember('dewi', 'Perempuan')
		];
		const relationships = [...spouseRel('budi', 'cinta'), ...spouseRel('budi', 'dewi')];

		const result = calculateTreeLayout(members, relationships);
		const byId = new Map(result.nodes.map((n) => [n.member.id, n]));
		const budiX = byId.get('budi')!.x;
		const cintaX = byId.get('cinta')!.x;
		const dewiX = byId.get('dewi')!.x;

		// Budi harus berada di antara Cinta & Dewi (baik urutan kiri-kanannya)
		const lo = Math.min(cintaX, dewiX);
		const hi = Math.max(cintaX, dewiX);
		expect(budiX).toBeGreaterThan(lo);
		expect(budiX).toBeLessThan(hi);
	});

	it('anak dari 2 istri yg keduanya bersebelahan ke suami tetap pakai garis siku sederhana (1 sub-path)', () => {
		const members = [
			mkMember('budi', 'Laki-laki'),
			mkMember('cinta', 'Perempuan'),
			mkMember('dewi', 'Perempuan'),
			mkMember('anak_bc', 'Perempuan'),
			mkMember('anak_bd', 'Laki-laki')
		];
		const relationships = [
			...spouseRel('budi', 'cinta'),
			...spouseRel('budi', 'dewi'),
			pcRel('budi', 'anak_bc', 'father'),
			pcRel('cinta', 'anak_bc', 'mother'),
			pcRel('budi', 'anak_bd', 'father'),
			pcRel('dewi', 'anak_bd', 'mother')
		];

		const result = calculateTreeLayout(members, relationships);
		for (const edge of result.edges) {
			if (edge.type === 'parent-child') {
				const moveCount = (edge.path ?? '').split('M').length - 1;
				expect(moveCount).toBe(1);
			}
		}
	});

	it('anak dari istri yg TIDAK bersebelahan ke suami (3+ istri) memakai rute jembatan', () => {
		// Budi + 3 istri: dgn 3 pasangan, minimal 1 istri pasti TIDAK bersebelahan
		// langsung ke Budi (dia cuma punya 2 sisi). Cari tahu dulu siapa istri yg
		// "terjauh" itu dari hasil layout, baru pasangkan anaknya ke sana — supaya
		// tes ini tidak bergantung urutan zig-zag spesifik.
		const wives = ['cinta', 'dewi', 'eka'];
		const baseMembers = [mkMember('budi', 'Laki-laki'), ...wives.map((w) => mkMember(w, 'Perempuan'))];
		const baseRelationships = wives.flatMap((w) => spouseRel('budi', w));

		const baseLayout = calculateTreeLayout(baseMembers, baseRelationships);
		const byIdBase = new Map(baseLayout.nodes.map((n) => [n.member.id, n]));
		const budiX = byIdBase.get('budi')!.x;

		function isAdjacentToBudi(wife: string): boolean {
			const wifeX = byIdBase.get(wife)!.x;
			const lo = Math.min(budiX, wifeX);
			const hi = Math.max(budiX, wifeX);
			return !wives.some((other) => {
				if (other === wife) return false;
				const otherX = byIdBase.get(other)!.x;
				return otherX > lo + 1 && otherX < hi - 1;
			});
		}

		const farWife = wives.find((w) => !isAdjacentToBudi(w));
		expect(farWife).toBeDefined();

		const members = [...baseMembers, mkMember('anak', 'Laki-laki')];
		const relationships = [
			...baseRelationships,
			pcRel('budi', 'anak', 'father'),
			pcRel(farWife!, 'anak', 'mother')
		];

		const result = calculateTreeLayout(members, relationships);
		const edge = result.edges.find((e) => e.type === 'parent-child')!;
		const moveCount = (edge.path ?? '').split('M').length - 1;
		expect(moveCount).toBe(4); // rute jembatan: 2 drop + 1 bridge + 1 batang
	});
});

describe('Jarak antar keluarga berbeda', () => {
	it('memberi jarak ekstra antara 2 pasangan akar yang tidak berhubungan sama sekali', () => {
		const members = [
			mkMember('ayahA', 'Laki-laki'),
			mkMember('ibuA', 'Perempuan'),
			mkMember('ayahB', 'Laki-laki'),
			mkMember('ibuB', 'Perempuan')
		];
		const relationships = [...spouseRel('ayahA', 'ibuA'), ...spouseRel('ayahB', 'ibuB')];

		const result = calculateTreeLayout(members, relationships);
		const byId = new Map(result.nodes.map((n) => [n.member.id, n]));

		// Jarak dalam 1 unit (ayahA-ibuA) harus tetap gap normal
		const withinUnitGap = byId.get('ibuA')!.x - (byId.get('ayahA')!.x + CARD_WIDTH);
		expect(withinUnitGap).toBeCloseTo(HORIZONTAL_GAP, 5);

		// Jarak antar 2 keluarga (ibuA -> ayahB, atau sebaliknya tergantung urutan sort)
		// harus lebih besar drpd gap normal
		const sortedByX = [...members].sort(
			(a, b) => byId.get(a.id)!.x - byId.get(b.id)!.x
		);
		const secondUnitFirstMember = sortedByX[2];
		const firstUnitLastMember = sortedByX[1];
		const betweenFamilyGap =
			byId.get(secondUnitFirstMember.id)!.x - (byId.get(firstUnitLastMember.id)!.x + CARD_WIDTH);
		expect(betweenFamilyGap).toBeGreaterThan(HORIZONTAL_GAP);
	});

	it('tetap pakai gap normal antar saudara kandung (berbagi ortu yang sama)', () => {
		const members = [
			mkMember('ayah', 'Laki-laki'),
			mkMember('ibu', 'Perempuan'),
			mkMember('anak1', 'Laki-laki'),
			mkMember('anak2', 'Perempuan')
		];
		const relationships = [
			...spouseRel('ayah', 'ibu'),
			pcRel('ayah', 'anak1', 'father'),
			pcRel('ibu', 'anak1', 'mother'),
			pcRel('ayah', 'anak2', 'father'),
			pcRel('ibu', 'anak2', 'mother')
		];

		const result = calculateTreeLayout(members, relationships);
		const byId = new Map(result.nodes.map((n) => [n.member.id, n]));

		const anak1X = byId.get('anak1')!.x;
		const anak2X = byId.get('anak2')!.x;
		const gap = Math.abs(anak2X - anak1X) - CARD_WIDTH;
		expect(gap).toBeCloseTo(HORIZONTAL_GAP, 5);
	});
});
