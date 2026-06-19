<template>
  <div class="base-button-group">
    <slot />
  </div>
</template>

<style scoped>
.base-button-group {
  display: inline-flex;
  align-items: center;
  gap: var(--game-space-sm);
}
</style>
