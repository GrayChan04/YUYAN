<template>
  <button class="base-button" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.base-button {
  min-width: var(--btn-width, 70px);
  height: var(--btn-height, 30px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--game-space-md);
  border: var(--border-base, 1px solid currentColor);
  border-radius: 4px;
  background: transparent;
  color: var(--primary, currentColor);
  font-size: var(--btn-font-size, var(--game-text-md));
  cursor: pointer;
  white-space: nowrap;
}

.base-button:hover:not(:disabled),
.base-button.active {
  background: var(--primary, currentColor);
  color: var(--hover, #fff);
}

.base-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
