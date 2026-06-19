<template>
  <div class="system-page" :class="systemClass">
    <main class="system-page__body">
      <slot />
    </main>

    <footer class="system-page__footer" aria-label="game footer">
      <p>© 2026 @陈墨_Gray All Rights Reserved. | 如有问题请联系：小红书</p>
      <p>@陈墨_Gray (ID：736099779)</p>
    </footer>
  </div>
</template>

<script setup>
defineProps({
  systemClass: {
    type: String,
    default: '',
  },
});
</script>
