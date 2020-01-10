<script>
  export let type;
  export let label;
  export let size;

  let style;
  $: if (size === 'normal'){ 
    style = 'btn btn-primary'
  } else if(size === 'small') {
    style = 'btn btn-sm btn-outline-secondary'
  } else {
    style = ''
  };
</script>

<button type={type} class={style} on:click>{label}</button>