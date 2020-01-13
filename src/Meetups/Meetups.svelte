<script>
  import Title from '../components/Title.svelte';
  import Event from './Event.svelte';
  import UpdateEvent from './UpdateEvent.svelte';

  let meetups = [
    { 
      id: '1', 
      title: 'Keyboard Cat',
      date: '01/02/2020',
      subtitle: 'This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.' 
    },
    { 
      id: '2', 
      title: 'Second Card',
      date: '02/03/2020',
      subtitle: 'Some quick example text to build on the card title and make up the bulk of the cards content.' 
    }
  ];

  let favoriteEvents = [];

  const onAddEvent = (event) => {
    const newEvent = {
      id: Math.random(),
      title: event.detail.title,
      date: event.detail.date,
      subtitle: event.detail.subtitle
    }

    meetups = [newEvent, ...meetups];
  }

  const onAddToFavorite = (event) => {
    favoriteEvents = [event, ...favoriteEvents];
  }

  const handleMessage = (event) => {
    console.log(event);
  }
</script>

<section>
  <Title title={"New Event"} />

  <UpdateEvent on:newEvent={onAddEvent} />

  <hr />

  <Title title={"List of Available meetups"} />
  <div class="row">
		{#each meetups as meetup, i (meetup.id)}
			<Event {...meetup} on:click={onAddToFavorite} on:message={handleMessage} />
		{/each}
	</div>

  <hr />
  You have <b>{favoriteEvents.length}</b> favorite events.
</section>

<style></style>