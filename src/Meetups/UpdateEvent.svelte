<script>
  import { createEventDispatcher } from 'svelte';
  import Button from '../components/Button.svelte';
  import TextInput from '../components/TextInput.svelte';

  const dispatch = createEventDispatcher();

  let title = '';
  let subtitle = '';
  let date = '';

  const onAddEvent = () => {
    dispatch('newEvent', { title, subtitle, date});
  }
</script>

<form on:submit|preventDefault={onAddEvent}>
  <TextInput controlType='text' id="title" label="Title:" value={title} on:input={event => title = event.target.value} />
  <TextInput controlType='textarea' id="subtitle" label="Subtitle:" value={subtitle} on:input={event => subtitle = event.target.value} />
  <TextInput controlType='date' id="date" label="Date:" value={date} on:input={event => date = event.target.value} />
  
  <Button type="submit" size="normal">Add event</Button>
</form>


<style></style>