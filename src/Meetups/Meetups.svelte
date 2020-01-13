<script>
  import { onDestroy } from 'svelte';
  import meetupStore from './meetup-store.js';
  import Title from '../components/Title.svelte';
  import Event from './Event.svelte';
  import UpdateEvent from './UpdateEvent.svelte';

  let meetups = [];
  let favoriteEvents = [];

  const unsubscribe = meetupStore.subscribe(d => meetups = d);

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  const onAddToFavorite = (event) => {
    favoriteEvents = [event, ...favoriteEvents];
  }

  const handleMessage = (event) => {
    console.log(event);
  }
</script>

<section>
  <Title title={"New Event"} />

  <UpdateEvent />

  <Title title={"List of Available meetups"} />
  <div class="row">
		{#each meetups as meetup, i (meetup.id)}
			<Event {...meetup} on:click={onAddToFavorite} on:message={handleMessage} />
		{/each}
	</div>

  You have <b>{favoriteEvents.length}</b> favorite events.
</section>

<style></style>