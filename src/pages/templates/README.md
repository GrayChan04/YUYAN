# System Page Template

Use `SystemPageTemplate.vue` for every full-screen game system.

```vue
<template>
  <SystemPageTemplate system-class="SystemName">
    <div class="main-container SystemName">
      <!-- system content here -->
    </div>
  </SystemPageTemplate>
</template>

<script setup>
import SystemPageTemplate from '../templates/SystemPageTemplate.vue';
</script>
```

The template owns the page frame and footer. Do not add another page footer
inside a system page.

The footer is intentionally small, centered, and outside the visual center of
the game screen.
