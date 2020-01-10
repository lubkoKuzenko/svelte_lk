<script>
	import Title from './Title.svelte';
	import Header from './Header.svelte';

	export let name = 'world';
	export let age = 0;
	let cats = [
		{ id: 'J---aiyznGQ', name: 'Keyboard Cat' },
		{ id: 'z_AbfPXTKms', name: 'Maru' },
		{ id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' }
	];

	$: nameC = `<b>calculation</b> ${age}`;
	$: if (age > 5){
		nameC = `Congradulations!`;
	};

	const onAgeChange = () => age += 1;
	const onInputChange = (event) => name = event.target.value;
</script>

<Header />
<main class="container">
	<Title title={name} />
	<h3>Age: {age}</h3>

	{#if age < 3}
		<p>nameC less than 3</p>
	{:else}
		<p>nameC more than 3</p>
	{/if}

	<p>{@html nameC}</p>
	<input type="text" value={name} on:input={onInputChange} />
	<input type="text" bind:value={name} />
	<button on:click={onAgeChange}>Change Age</button>

	<hr />
	<h3>List</h3>
	<ul>
		{#each cats as { id, name }, i (id)}
			<li>
				<a target="_blank" href="https://www.youtube.com/watch?v={id}">{i + 1}: {name}</a>
			</li>
		{/each}
	</ul>

	<hr />
</main>

<style></style>