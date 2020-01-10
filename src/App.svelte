<script>
	import Title from './Title.svelte';
	import Header from './Header.svelte';

	export let name = 'world';
	export let age = 0;

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
	<p>{@html nameC}</p>
	<input type="text" value={name} on:input={onInputChange} />
	<input type="text" bind:value={name} />
	<button on:click={onAgeChange}>Change Age</button>
</main>

<style></style>