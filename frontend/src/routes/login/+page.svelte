<script lang="ts">
	import { goto } from '$app/navigation';
	import LoginModal from '$lib/LoginModal.svelte';

	let open = $state(true);

	$effect(() => {
		if (!open) goto('/');
	});
</script>

<svelte:head>
	<title>Log in</title>
</svelte:head>

<LoginModal bind:open onSuccess={() => goto('/')} />
