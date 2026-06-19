<template>
  <transition name="fade">
    <div v-if="visible" class="intro-screen">
      <div class="intro-text">你要接受预言的安排</div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
});
</script>

<style scoped>
.intro-screen {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 99999;

  display: flex;
  justify-content: center;
  align-items: center;
}

.intro-text {
  color: white;
  font-size: clamp(56px, 7vw, 120px);
  letter-spacing: 0.5em; /* 核心：字符间距 */
  font-weight: 200;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  width: 100%;
}

@keyframes prophecyText {
  /* 完全不可见 */
  0% {
    opacity: 0;
    filter: brightness(1);
    text-shadow: none;
  }

  /* 瞬间出现 */
  15% {
    opacity: 1;
    filter: brightness(1);
    text-shadow: none;
  }

  /* 保持稳定 */
  65% {
    opacity: 1;
    filter: brightness(1);
    text-shadow: none;
  }

  /* 快速闪白 */
  78% {
    opacity: 1;
    filter: brightness(5);
    text-shadow: 0 0 8px #fff, 0 0 20px #fff, 0 0 40px #fff;
  }

  /* 消失 */
  100% {
    opacity: 0;
    filter: brightness(8);
    text-shadow: 0 0 20px #fff, 0 0 40px #fff, 0 0 80px #fff;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
