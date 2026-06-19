<template>
  <!-- Teleport 确保提示框永远位于页面最顶层，不受父元素 overflow 影响 -->
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" class="cyber-toast-overlay" :class="$attrs.class">
        <div class="cyber-toast">
          <span class="toast-icon"></span>
          <span class="toast-text">{{ message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineOptions({ inheritAttrs: false });

import { ref } from 'vue';

const props = defineProps({
  duration: { type: Number, default: 1500 }, // 默认停留 1.5 秒
});

const visible = ref(false);
const message = ref('');
let timer = null;

// 公开给父组件调用的方法
const show = (msg) => {
  message.value = msg;
  visible.value = true;

  // 如果之前有定时器，先清除，防止闪烁
  if (timer) clearTimeout(timer);

  // 设定倒计时关闭
  timer = setTimeout(() => {
    visible.value = false;
  }, props.duration);
};

// 暴露 show 方法给父组件
defineExpose({ show });
</script>

<style scoped>
.cyber-toast-overlay {
  /* 4. 修改：不再使用 100vw/vh，让它定位在中心但大小随内容变化 */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10001;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保变量能传给内部 */
  background: transparent !important; 
  width: auto;  /* 确保它不撑开 */
  height: auto;
}
.cyber-toast {
  background-color: var(--bg); /* 深黑背景 */
  border: 1px solid var(--primary); /* 亮绿边框 */
  box-shadow: 0 0 15px var(--bg-mask); /* 微弱光晕 */


  padding: 15px 40px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  pointer-events: none; /* 让鼠标穿透，不阻挡下面操作 */
}

.toast-icon {
  color: var(--primary);
  font-weight: bold;
}

.toast-text {
  color: var(--primary);
  font-size: var(--text-title);
  letter-spacing: 2px;
  white-space: pre-line;
}

/* 淡入淡出动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%); /* 稍微带点位移感 */
}
</style>
