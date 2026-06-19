<template>
  <div class="table-container">
    <table class="HÖÐR-table">
      <thead>
        <tr>
          <!-- 循环渲染表头 -->
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ width: col.width }"
            :class="{ 'hint-header': col.isHint }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- 循环渲染每一行数据 -->
        <template v-for="(row, index) in data" :key="index">
          <!-- 第一行：原本的数据行 -->
          <!-- 逻辑：如果 row.hint 存在且不是空字符串，应用 alert-row 样式 -->
          <tr :class="{ 'alert-row': row.isAlert }">
            <td v-for="col in columns" :key="col.key" :class="col.class">
              <slot :name="col.key" :row="row">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
          <!-- 第二行：展开详情行 (只有 row.isExpanded 为 true 时才显示) -->
          <tr v-if="row.isExpanded" class="expand-row">
            <!-- colspan 让这一格横跨所有列 -->
            <td :colspan="columns.length">
              <!-- 定义一个叫 'expand' 的插槽，让父组件决定这里显示什么 -->
              <slot name="expand" :row="row"></slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- 无数据时的提示 -->
    <div v-if="data.length === 0" class="no-data">[ 没有找到相关的数据 ]</div>
  </div>
</template>

<script setup>
// 接收父组件传来的 props
defineProps({
  columns: {
    type: Array,
    required: true,
    // 结构示例: [{ label: '日期', key: 'date', width: '15%' }]
  },
  data: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
/* 这里放通用的表格样式 */
.table-container {
  flex: 1;
  overflow-y: auto;
}

.HÖÐR-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;         /* 消除 separate 带来的间隙 */
  font-size: var(--text-base);
  text-align: left;
}

.HÖÐR-table th {
  position: sticky;   /* 开启粘性定位 */
  top: 0;             /* 粘在容器顶部 */
  z-index: 10;        /* 确保表头在滚动时浮在内容上方 */
  
  /* 必须加上背景色，否则内容滚动到下方时会透出来 */
  background-color: var(--bg-table-head); /* 替换为你实际的背景变量，通常是 body 的背景色 */
  text-align: center;
  font-weight: 400; /* 细字体 */
  padding: 10px;
  border-bottom: var(--border-around);
  color: var(--primary);
  opacity: 1;
  letter-spacing: 2px;
}

.HÖÐR-table td {
  text-align: center;
  padding: 15px 10px;
  border-bottom: var(--border-one);
  color: #fff;
  vertical-align: top; /* 确保多行内容顶部对齐 */
}

.HÖÐR-table tbody tr:hover {
  background: var(--bg-panel);
}

.expand-row td {
  text-align: left;
  border-bottom: 1px dashed var(--primary); /* 虚线底边 */
  padding: 15px 20px;
}

/* 警报行样式 */
.alert-row td {
  color: var(--red-alert) !important; /* 强制变红 */
}

.alert-row :deep(*) {
  color: var(--red-alert) !important;
}

.no-data {
  text-align: center;
  padding: 50px;
  opacity: 0.5;
}

/* 特殊：支持外部传入的 hint-header 样式 */
.hint-header {
  opacity: 0.2 !important;
  font-size: var(--text-base);
}
</style>
