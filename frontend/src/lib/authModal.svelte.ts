export const loginModalState = $state<{ open: boolean; onSuccess?: () => void }>({
	open: false,
	onSuccess: undefined
});

export function openLoginModal(onSuccess?: () => void) {
	loginModalState.onSuccess = onSuccess;
	loginModalState.open = true;
}
