<script>
  export let controlType;
  export let id;
  export let label;
  export let value;
</script>

<div class="form-group">
    <label for={id}>{label}</label>

    {#if controlType === 'textarea'}
      <textarea rows="3" class="form-control" id={id} value={value} on:input />
    {:else}
      <input type={controlType} class="form-control" id={id} value={value} on:input />
    {/if}
</div>


