// Stack sederhana untuk mengelola urutan modal terbuka (Escape hanya menutup modal teratas)
type ModalCloseFn = () => void;

const modalStack: ModalCloseFn[] = [];

if (typeof window !== 'undefined') {
	window.addEventListener('keydown', (e: KeyboardEvent) => {
		if (e.key === 'Escape' && modalStack.length > 0) {
			e.stopPropagation();
			const topClose = modalStack[modalStack.length - 1];
			topClose();
		}
	});
}

export function registerModal(onclose: ModalCloseFn): () => void {
	modalStack.push(onclose);
	return () => {
		const idx = modalStack.lastIndexOf(onclose);
		if (idx !== -1) {
			modalStack.splice(idx, 1);
		}
	};
}
