<template>
  <Teleport to="body">
    <Transition name="modal-popup">
      <div
        v-if="visible"
        class="popup-overlay"
        :class="[$attrs.class]"
        @click.self="handleClose"
      >
        <div
          class="popup-window"
          :class="{ shake: isError, 'error-state': isError }"
        >
          <!-- 标题栏：现在完全由父组件动态传入 -->
          <div class="popup-header">
            <span class="warning-icon">>_</span>
            <span>{{ title || (isError ? '认证错误' : '访问认证') }}</span>
          </div>

          <!-- 内容区 -->
          <div class="popup-content">
            <!-- 【模式1：双层/单层 密码模式】 passwordOnly只输入密码无hint-->
            <template
              v-if="mode === 'query+password' || mode === 'passwordOnly'"
            >
              <div v-if="mode === 'query+password'" class="hint-box">
                <input
                  ref="queryRef"
                  type="text"
                  v-model="query"
                  class="popup-input"
                  @keydown.enter="focusPassword"
                  @input="query = query.toLowerCase()"
                />
                <span class="hint-text">{{ hint }}</span>
              </div>
              <input
                ref="passwordRef"
                type="text"
                v-model="password"
                class="popup-input"
                placeholder="请输入密码"
                @keydown.enter="submit"
                autocomplete="off"
              />
            </template>

            <!-- 【模式2：通用单行验证模式】(完美合并了原先的 extraVerify 和 linkOnly) 无hint-->
            <template v-if="mode === 'singleVerify'">
              <div class="hint-box">
                <span class="hint-text">{{ hint }}</span>
              </div>
              <input
                ref="singleRef"
                type="text"
                v-model="singleInput"
                class="popup-input"
                placeholder=""
                @keydown.enter="submit"
                autocomplete="off"
              />
            </template>

            <!-- 【模式3：账号登陆模式，查表账号和密码是否存在-->
            <template v-if="mode === 'login'">
              <span
                v-if="$attrs.class === 'HÖÐR'"
                :style="{
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  color: isError ? 'var(--theme-color)' : 'inherit', // 错误时变红，正常时继承
                  transition: 'color 0.3s ease', // 添加平滑过渡感
                }"
              >
                Keep
                <span style="color: #ff4444">SILENT</span> In DARKNESS
              </span>
              <div class="hint-box" :class="{ 'no-border': mode === 'login' }">
                <span v-if="$attrs.class === 'HÖÐR'" class="form-label"
                  >用　　户：</span
                >
                <span v-else class="form-label">个人工号：</span>
                <input
                  ref="queryRef"
                  type="text"
                  v-model="query"
                  class="popup-input"
                  style="flex: 1; text-align: left"
                  @keydown.enter="focusPassword"
                  autocomplete="off"
                />
              </div>
              <div class="hint-box" :class="{ 'no-border': mode === 'login' }">
                <span class="form-label">密　　码：</span>
                <input
                  ref="passwordRef"
                  type="password"
                  v-model="password"
                  class="popup-input"
                  style="flex: 1; text-align: left"
                  @keydown.enter="submit"
                  autocomplete="off"
                />
              </div>
            </template>

            <!-- 状态提示 -->
            <div v-if="mode !== 'login'" class="status-msg">
              <span v-if="isError" class="error-text">{{ '认证失败' }}</span>
              <!-- ✅ 修改这里：根据 silentError 动态判断显示什么文字 -->
              <span v-else-if="isSuccess" class="success-text">
                {{ silentError ? '运行成功' : '认证成功' }}
              </span>
              <span v-else class="blink">等待输入中...</span>
            </div>
            <div v-else-if="$attrs.class === 'HÖÐR'" class="footer-hint">
              <span class="blink" style="color: #ff4444; opacity: 1"
                >Time to Wake Up</span
              >
            </div>
            <div v-else class="footer-hint">
              <span>已与研究院对接备案，请使用内网认证信息登录</span>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="popup-footer">
            <button class="tool-btn cancel" @click="handleClose">取消</button>
            <button class="tool-btn confirm" @click="submit">确定</button>
          </div>
        </div>
      </div>
    </Transition>
    <Toast ref="toastRef" :class="$attrs.class" />
  </Teleport>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
});

import { ref, watch, nextTick, useAttrs } from 'vue';
import Toast from './BaseToast.vue'; // 确保路径正确

const props = defineProps({
  visible: Boolean,
  persistent: Boolean, // 🎯 新增：是否禁止点击遮罩关闭
  title: String, // ✅ 新增：动态标题
  hint: String, // ✅ 通用提示语
  correctPassword: String, // ✅ 通用目标答案 (也兼职做密码1)
  correctPassword2: String, // ✅ 密码 2
  correctQuery: String, // ✅ 查询条件
  userList: Array, // 👈 新增：从父组件传入 personnelDataRaw
  silentError: Boolean, // ✅ 新增：错误时是否静默拦截 (不抖动)
  mode: { type: String, default: 'query+password' },
});

const emit = defineEmits(['update:visible', 'success']);

const query = ref('');
const password = ref('');
const singleInput = ref(''); // ✅ 合并了原来的 link 和 extraInput
const isError = ref(false);
const toastRef = ref(null); // 用于调用 Toast 的 show 方法
const isSuccess = ref(false);
const attrs = useAttrs();

const queryRef = ref(null);
const passwordRef = ref(null);
const singleRef = ref(null);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      query.value = '';
      password.value = '';
      singleInput.value = '';
      isError.value = false;
      isSuccess.value = false;

      nextTick(() => {
        // 修改判断条件
        if (props.mode === 'query+password' || props.mode === 'login') {
          queryRef.value?.focus();
        } else if (props.mode === 'passwordOnly') {
          passwordRef.value?.focus();
        } else if (props.mode === 'singleVerify') {
          singleRef.value?.focus();
        }
      });
    }
  }
);

// Popup.vue 的 handleClose 函数
const handleClose = () => {
  // 🎯 如果设置了 persistent 为 true，则直接返回，不触发关闭
  if (props.persistent) return;

  emit('update:visible', false);
};

const focusPassword = () => {
  passwordRef.value?.focus();
};

const submit = () => {
  // 👈 登录模式拦截逻辑
  // 【模式3：账号登陆模式】
  if (props.mode === 'login' && props.userList) {
    const isHodr = attrs.class === 'HÖÐR';
    const inputAcc = String(query.value).trim();
    const inputPwd = String(password.value).trim();

    // 1. 查找用户对象
    const user = props.userList.find((u) => u.account === inputAcc);

    // 2. 账号校验逻辑
    if (!user) {
      // 账号不存在：触发错误状态
      isError.value = true;
      setTimeout(() => (isError.value = false), 800);

      // 提示信息
      const errorMsg = isHodr ? '认证失败' : '认证失败：该工号不存在';
      toastRef.value?.show(errorMsg);

      // 逻辑处理：清空全部，回跳账号框
      query.value = '';
      password.value = '';
      nextTick(() => queryRef.value?.focus());
      return;
    }

    // 3. 密码校验逻辑 (走到这里说明账号是正确的)
    const isPwdCorrect =
      user.password &&
      user.password.trim() !== '' &&
      user.password === inputPwd;

    if (!isPwdCorrect) {
      // 密码错误：触发错误状态
      isError.value = true;
      setTimeout(() => (isError.value = false), 800);

      // 提示信息
      let errorMsg = isHodr ? '认证失败' : '认证失败：密码输入错误';
      if (!isHodr && (!user.password || user.password.trim() === '')) {
        errorMsg = '好像不太对 这人和这件事关系不大吧';
      }
      toastRef.value?.show(errorMsg);

      // ✅ 核心修改：保留 query.value，只清空密码，聚焦密码框
      password.value = '';
      nextTick(() => passwordRef.value?.focus());
      return;
    }

    // 4. 验证通过
    toastRef.value?.show('登录成功');
    isSuccess.value = true;
    setTimeout(() => {
      emit('success', user);
      handleClose();
    }, 800);
    return;
  }

  // ===== 1. 通用单行验证模式 (完美合并版) =====
  if (props.mode === 'singleVerify') {
    const inputS = String(singleInput.value).trim().toLowerCase();
    const targetS = String(props.correctPassword || '')
      .trim()
      .toLowerCase(); // 复用正确答案字段

    if (inputS === targetS) {
      isSuccess.value = true;
      setTimeout(() => {
        emit('success', inputS);
        handleClose();
      }, 800);
    } else {
      // ✅ 根据父组件传来的 silentError 决定是静默还是红屏抖动
      if (props.silentError) return;

      isError.value = true;
      setTimeout(() => (isError.value = false), 800);
      singleInput.value = '';
      nextTick(() => singleRef.value?.focus());
    }
    return;
  }

  // ===== 2. 初始密码验证模式 =====
  const inputQ = String(query.value).trim().toLowerCase();
  const targetQ = String(props.correctQuery || '')
    .trim()
    .toLowerCase();
  const inputP = String(password.value).trim().toLowerCase();
  const targetP1 = String(props.correctPassword || '')
    .trim()
    .toLowerCase();
  const targetP2 = String(props.correctPassword2 || '')
    .trim()
    .toLowerCase();

  const isQueryCorrect =
    props.mode === 'passwordOnly' ? true : inputQ === targetQ;
  const isPass1 = inputP === targetP1 && targetP1 !== '';
  const isPass2 = inputP === targetP2 && targetP2 !== '';

  if (isQueryCorrect && (isPass1 || isPass2)) {
    isSuccess.value = true;
    setTimeout(() => {
      emit('success', isPass1 ? 'pass1' : 'pass2');
      handleClose();
    }, 800);
  } else {
    isError.value = true;
    setTimeout(() => (isError.value = false), 800);

    if (!isQueryCorrect) query.value = '';
    if (!isPass1 && !isPass2) password.value = '';

    nextTick(() => {
      if (!isQueryCorrect && props.mode !== 'passwordOnly')
        queryRef.value?.focus();
      else passwordRef.value?.focus();
    });
  }
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.popup-window {
  /* 核心控制变量 */
  --theme-color: var(--primary);
  --theme-bg: var(--bg-panel);

  width: 500px;
  background: var(--bg);
  border: 2px solid var(--theme-color);
  box-shadow: 0 0 20px var(--theme-bg);
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

/* 错误状态只需切换两个变量 */
.popup-window.error-state {
  --theme-color: var(--red-alert) !important;
}

.popup-header {
  background: var(--theme-bg);
  padding: 10px 20px;
  border-bottom: 1px solid var(--theme-color);
  color: var(--theme-color);
  font-weight: bold;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.popup-content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hint-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  color: var(--theme-color);
  border: 1px dashed var(--theme-color);
  opacity: 0.8;
}

.hint-box.no-border {
  border: none !important; /* 强制去掉虚线框 */
  padding-left: 0; /* 可选：让文字和左侧对齐得更自然 */
  background: transparent; /* 确保没有背景色干扰 */
}

.popup-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--theme-color);
  color: var(--theme-color);
  padding: 10px;
  outline: none;
  text-align: center;
  letter-spacing: 5px;
  transition: border-color 0.3s;
}

.status-msg {
  height: 20px;
  font-size: var(--text-popup); /* 使用你定义的 0.8rem */
  text-align: center;
  color: var(--theme-color);
}

.popup-footer {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: var(--one-border);
}

/* 按钮响应式变色 */
.popup-footer .tool-btn {
  background: transparent; /* 保持透明背景 */
  border: 1px solid var(--theme-color);
  border-color: var(--theme-color);
  color: var(--theme-color);
  transition: all 0.3s ease;
}

.popup-footer .tool-btn:hover {
  background: var(--theme-color);
  color: var(--hover);
}

.popup-footer .tool-btn:hover:not(:disabled) {
  background: var(--theme-color);
  color: var(--hover);
}

/* 动画部分保持不变... */
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
/* @keyframes shake, popIn, blink... */
@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.blink {
  animation: blink 1s infinite;

  opacity: 0.5;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.success-text {
  color: var(--theme-color);
  font-weight: bold;
}
.error-text {
  color: var(--theme-color);
  font-weight: bold;
}

.footer-hint {
  text-align: center;
  margin-top: 10px;
  letter-spacing: 2px;
}
</style>
