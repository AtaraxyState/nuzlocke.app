<script>
  export let heading,
    body,
    className = ''
</script>

<div
  class="flex h-12 w-14 flex-col justify-center p-1 text-center text-gray-800 dark:text-gray-200 md:h-14 md:w-14 {className}"
>
  <span class="text-tiny leading-3 md:scale-100">{heading}</span>
  <span class="text-2xl font-bold">{body}</span>
</div>
