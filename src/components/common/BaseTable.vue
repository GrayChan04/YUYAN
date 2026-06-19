<template>
  <div class="base-table-wrap">
    <table class="base-table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.base-table-wrap {
  width: 100%;
  min-height: 0;
  overflow: auto;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--primary, currentColor);
  font-size: var(--text-base, var(--game-text-md));
}

.base-table :deep(th),
.base-table :deep(td) {
  padding: var(--game-space-sm) var(--game-space-md);
  border-bottom: var(--border-one, 1px solid currentColor);
  text-align: left;
}
</style>
