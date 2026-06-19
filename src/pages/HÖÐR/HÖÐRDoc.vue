<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="doc-window"
      :class="{ 'is-maximized': isMaximized }"
      :style="windowStyle"
      @mousedown="bringToFront"
    >
      <div class="doc-header" @mousedown="startDrag" @dblclick="toggleMaximize">
        <span class="doc-title"> {{ title || 'DOCUMENT_VIEWER.exe' }}</span>
        <div class="header-controls">
          <span
            class="control-btn"
            :class="{ active: isMaximized }"
            :title="isMaximized ? '还原' : '最大化'"
            @mousedown.stop
            @click="toggleMaximize"
          >
            ❐
          </span>
          <span class="control-btn" @mousedown.stop @click="handleClose"
            >X</span
          >
        </div>
      </div>

      <div class="doc-body">
        <div class="simulated" v-html="content"></div>
        <slot></slot>
      </div>

      <div class="doc-footer" v-if="showFooter">
        <button class="tool-btn cancel" @mousedown.stop @click="handleCancel">
          取消
        </button>
        <button class="tool-btn confirm" @mousedown.stop @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue';

const props = defineProps({
  visible: Boolean,
  title: String,
  content: String,
  showFooter: { type: Boolean, default: false },
  confirmText: { type: String, default: '确定' },
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// --- 状态变量 ---
const position = ref({ x: window.innerWidth / 2 - 250, y: 150 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// ✅ 新增：全屏控制逻辑
const isMaximized = ref(false);
const lastRect = ref({ width: 500, height: 600, x: 0, y: 0 });

const toggleMaximize = () => {
  if (!isMaximized.value) {
    // 放大前：保存当前位置，以便还原
    lastRect.value = {
      x: position.value.x,
      y: position.value.y,
    };
    isMaximized.value = true;
  } else {
    // 缩小后：还原位置
    position.value = { x: lastRect.value.x, y: lastRect.value.y };
    isMaximized.value = false;
  }
};

// ✅ 新增：全局层级追踪
// 使用 window 对象确保所有 HÖÐRDoc 实例共享同一个计数器
const zIndex = ref(10000);

const bringToFront = () => {
  if (window.globalZIndex === undefined) {
    window.globalZIndex = 10000;
  }
  window.globalZIndex++;
  zIndex.value = window.globalZIndex;
};

// 修改计算属性 windowStyle，加入 zIndex
const windowStyle = computed(() => {
  const base = isMaximized.value
    ? { top: 0, left: 0, width: '100vw', height: '100vh', resize: 'none' }
    : { top: position.value.y + 'px', left: position.value.x + 'px' };

  return {
    ...base,
    zIndex: zIndex.value, // ✅ 应用动态层级
  };
});

// --- 拖拽逻辑 (增加全屏拦截) ---
const startDrag = (e) => {
  if (isMaximized.value) return; // ✅ 全屏模式禁止拖拽
  isDragging.value = true;
  dragOffset.value.x = e.clientX - position.value.x;
  dragOffset.value.y = e.clientY - position.value.y;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  let newX = e.clientX - dragOffset.value.x;
  let newY = e.clientY - dragOffset.value.y;
  newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
  newY = Math.max(0, Math.min(newY, window.innerHeight - 40));
  position.value = { x: newX, y: newY };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// --- 其他逻辑保持不变 ---
const handleClose = () => {
  isMaximized.value = false; // 关闭时重置状态
  emit('update:visible', false);
};
const handleCancel = () => {
  emit('cancel');
  handleClose();
};
const handleConfirm = () => {
  emit('confirm');
  handleClose();
};

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});

// 初始化时置顶
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      bringToFront();
      // 增加一个微小的初始偏移，防止完全重叠（可选）
      const offset = (window.globalZIndex % 10) * 10;
      position.value = {
        x: window.innerWidth / 2 - 250 + offset,
        y: 150 + offset,
      };
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* --- 窗口主体 --- */
.doc-window {
  position: fixed;
  /* 默认大小 */
  width: 500px;
  height: 600px;
  /* 最小限制，防止缩得太小 */
  min-width: 300px;
  min-height: 200px;

  background: #050708;
  border: var(--border-around);
  box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.8), 0 0 10px var(--bg-mask);
  display: flex;
  flex-direction: column;
  z-index: 10000;

  /* ✅ 核心魔法：允许通过拖动右下角来改变大小！ */
  resize: both;
  overflow: hidden; /* 必须配合 hidden，resize 才会生效 */
}

/* --- 拖拽头部 --- */
.doc-header {
  background: var(--bg-mask);
  padding: 5px 15px;
  border-bottom: var(--border-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move; /* 鼠标变成十字拖拽图标 */
  user-select: none; /* 防止拖拽时选中文字 */
}

.doc-title {
  color: var(--primary);
  font-weight: bold;
  font-size: var(--text-base);
}

.control-btn {
  color: var(--primary);
  cursor: pointer;
  font-weight: bold;
  transition: color 0.3s;
}

.control-btn:hover {
  color: var(--red-alert, #ff4444);
}

/* --- 内容区域 (完美模拟 PDF 排版) --- */
.doc-body {
  flex: 1;
  padding: 30px;
  /* ✅ 允许内容过多时，上下左右滚动 */
  overflow: auto;
}

/* 滚动条赛博风美化 */
.doc-body::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.doc-body::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}
.doc-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

/* --- 虚拟 PDF 样式 --- */
.simulated {
  color: #ddd; /* 略暗的白色，不刺眼 */
  font-size: var(--text-base);
  line-height: 1.5; /* 舒适的行间距 */
  letter-spacing: 1px;
}

/* 段落间距 */
.simulated p {
  margin-bottom: 1.5em;
  text-indent: 2em; /* 首行缩进 */
}

/* 加粗重点 */
.simulated strong {
  color: var(--primary);
  font-weight: normal;
}

/* 完美还原表格 */
.simulated table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  color: var(--primary);
}
.simulated th,
.simulated td {
  border: var(--border-one);
  padding: 5px 10px;
  text-align: left;
}
.simulated th {
  font-weight: bold;
}

/* --- 底部按钮区 --- */
.doc-footer {
  padding: 15px;
  border-top: var(--border-one);
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  background: #050708;
}
</style>
