<script lang="ts">
	import { goto } from '$app/navigation';
	import RegisterModal from '$lib/RegisterModal.svelte';

	let open = $state(true);

	$effect(() => {
		if (!open) goto('/');
	});
</script>

<svelte:head>
	<title>Sign up</title>
</svelte:head>

<RegisterModal bind:open onSuccess={() => goto('/')} onSwitchToLogin={() => goto('/login')} />
