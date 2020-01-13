<script>
  import { createEventDispatcher } from 'svelte';
  import Button from '../components/Button.svelte';
  
  const dispatch = createEventDispatcher();

  export let id = Math.random();
  export let title;
  export let subtitle;
  export let date;

  const onShowDetails = () => {
    dispatch('message', { text: 'Hello!' });
  }
</script>

<div class="col-md-4">
  <div class="card mb-4 shadow-sm">
    <img src="http://placehold.it/400x225" alt="" />
    <div class="card-body">
      <h5 class="card-title">{title}</h5>
      <p class="card-text">{subtitle}</p>
      <div class="d-flex justify-content-between align-items-center">
        <div class="btn-group">
          <Button type="button" size="small" on:click={onShowDetails}>Show Details</Button>
          <Button type="button" size="small" on:click>Favorite</Button>
        </div>
        <small class="text-muted">{date}</small>
      </div>
    </div>
  </div>
</div>

<style></style>