<template>
  <transition name="fade-out">
    <div v-if="isVisible" class="login-overlay" :class="[$attrs.class]">
      <div class="login-container">
        <h1 class="system-title">HÖÐR</h1>

        <div class="login-steps">
          <div class="step-line" :class="{ active: step1Active }">
            {{ step1Text }}<span v-if="step1Typing" class="cursor"></span>
          </div>
          <div class="step-line user-name" :class="{ active: step2Active }">
            {{ step2Text }}<span v-if="step2Typing" class="cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['finished']);

// 状态控制
const isVisible = ref(true);
const step1Text = ref('');
const step2Text = ref('');
const step1Typing = ref(false);
const step2Typing = ref(false);
const step1Active = ref(false);
const step2Active = ref(false);

// 配置
const SPEED = 60; // 打字速度
const OPERATOR_NAME = 'CHEN MO       陈墨';

// 打字机核心函数
const typeWriter = async (text, refTarget, typingRef) => {
  typingRef.value = true;
  for (let i = 0; i <= text.length; i++) {
    refTarget.value = text.substring(0, i);
    await new Promise((resolve) => setTimeout(resolve, SPEED));
  }
  typingRef.value = false;
};

onMounted(async () => {
  // 步骤 1: 验证登录
  step1Active.value = true;
  await typeWriter('已验证登录...', step1Text, step1Typing);

  await new Promise((r) => setTimeout(r, 400)); // 停顿

  // 步骤 2: 显示操作者
  step2Active.value = true;
  await typeWriter(OPERATOR_NAME, step2Text, step2Typing);

  // 结束动画
  await new Promise((r) => setTimeout(r, 1000));
  isVisible.value = false;

  // 通知父组件动画结束，可以显示主界面了
  setTimeout(() => {
    emit('finished');
  }, 1000); // 等待 CSS fade-out 动画完成
});
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: var(--bg); /* 使用 HÖÐR.css 变量 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  text-align: center;
}

.system-title {
  font-size: 12rem;
  font-weight: 200;
  letter-spacing: 20px;
  color: #fff;
  margin-bottom: 50px;
  text-transform: uppercase;
  /* 增加轻微的发光效果，呼应 HÖÐR 风格 */
  text-shadow: 0 0 20px var(--bg-mask);
}

.login-steps {
  height: 80px; /* 固定高度防止抖动 */
}

.step-line {
  font-size: var(--text-title);
  margin-top: 10px;
  letter-spacing: 2px;
  color: var(--primary);
  opacity: 0;
  transition: opacity 0.5s;
}

.step-line.active {
  opacity: 1;
}

.user-name {
  color: #fff;
  margin-top: 15px;
  font-size: 1.2rem;
  white-space: pre;
}

/* 呼吸光标 */
.cursor {
  display: inline-block;
  width: 10px;
  height: 5px;
  background-color: var(--primary);
  margin-left: 10px;
  animation: pulse 1s infinite;
  vertical-align: middle;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.1;
    transform: scaleX(1.5);
  }
}

/* 退出过渡动画 */
.fade-out-leave-active {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-out-leave-to {
  opacity: 0;
  filter: blur(20px);
  transform: scale(1.05);
}
</style>
