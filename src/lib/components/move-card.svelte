<script>
  export let name
  export let priority = 0
  export let power = null
  export let type
  export let damage_class
  export let effect = ''
  export let stab
  import { capitalise } from '$lib/utils/string'

  import { Tooltip, Icon } from '$c/core/'
  import TypeBadge from '$lib/components/type-badge.svelte'

  import { Sword, Boost } from '$icons'
  import { Asterisk as Info } from '$icons'
  import { Chevron as Priority, DoubleChevron as HighPriority } from '$icons'
</script>

<div class="my-2">
  <p
    class="relative mb-1 flex flex-row items-center space-x-1 overflow-ellipsis text-sm"
  >
    <span class="relative w-auto {effect ? 'mr-2 cursor-help' : ''}">
      {#if effect}
        <Tooltip>{effect}</Tooltip>
        <Icon
          inline={true}
          height="0.8em"
          icon={Info}
          class="absolute right-0 top-1 -translate-y-1/2 translate-x-full fill-current"
        />
      {/if}

      <span class="font-medium">
        {capitalise(name)}
      </span>
    </span>

    {#if power}
      <span class="relative inline-flex items-center text-sm font-bold">
        <!-- Icon -->
        <span class="relative">
          <Icon inline icon={Sword} class="fill-current text-xs" />
        </span>

        <!-- Desktop power -->
        <span class="invisible relative w-0 sm:visible sm:w-auto">
          {#if stab}
            <Tooltip>Base power {power}</Tooltip>
            <Icon
              inline
              icon={Boost}
              class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 fill-current"
            />
            <span class="cursor-help font-bold">
              {Math.round(power * 1.5)}
            </span>
          {:else}
            {power}
          {/if}
        </span>

        <!-- Mobile Power -->
        <span
          class="visible inline-flex w-auto items-center font-bold sm:hidden sm:w-0"
        >
          {power}
          {#if stab}
            <span class="ml-0.5 text-tiny font-normal text-gray-500"
              >+{Math.round(power * 0.5)}</span
            >
          {/if}
        </span>
      </span>
    {/if}
  </p>

  <div class="flex items-center justify-start gap-x-1">
    <TypeBadge type={damage_class} />
    <TypeBadge {type} />
    <!-- Priority icons -->
    {#if priority > 0}
      <span class="flex flex-row dark:text-gray-200">
        {#if priority > 3}
          <Icon inline icon={HighPriority} class="-mr-1.5 fill-current" />
          <Icon inline icon={HighPriority} class="fill-current" />
        {:else if priority > 2}
          <Icon inline icon={HighPriority} class="-mr-1.5 fill-current" />
          <Icon inline icon={Priority} class="fill-current" />
        {:else if priority > 1}
          <Icon inline icon={HighPriority} class="fill-current" />
        {:else}
          <Icon inline icon={Priority} class="fill-current" />
        {/if}
      </span>
    {/if}
  </div>
</div>
