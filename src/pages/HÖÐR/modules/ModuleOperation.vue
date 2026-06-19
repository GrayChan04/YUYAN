<template>
  <!-- 操作日志 -->
  <div class="module-operation HÖÐR">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <span class="search-label">>></span>
      <input
        type="text"
        v-model="inputKeyword"
        @keydown.enter="handleEnter"
        placeholder="输入日期搜索"
        class="input"
      />
      <!-- 新增：隐藏信息区域 -->
      <div class="hidden-msg-area">
        <span class="hidden-msg-text">现实和虚假分不清哪一个</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <!-- 【使用通用表格组件】 -->
    <HÖÐRTable :columns="tableColumns" :data="filteredOperation">
      <template #detail="{ row }">
        <span class="view-btn" @click="handleRowClick(row)">
          {{ row.isExpanded ? '收起' : '查看' }}
        </span>
      </template>
      <!-- 新增：展开后的内容区域 -->
      <!-- 这里对应 HÖÐRTable 里的 slot name="expand" -->
      <template #expand="{ row }">
        <div class="expand-content">
          <p>{{ row.detail }}</p>
          <!-- 你甚至可以在这里放图片、更多信息 -->
        </div>
      </template>
    </HÖÐRTable>
    <Popup
      v-model:visible="showPopup"
      class="HÖÐR"
      title="访问认证"
      :hint="currentHint"
      :correct-password="currentPassword"
      :correct-query="currentQuery"
      mode="query+password"
      :silent-error="false"
      @success="handleUnlock"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import HÖÐRTable from '../HÖÐRTable.vue'; // 引入组件
import Popup from '../../../components/common/BasePopup.vue'; // 引入组件
import rawData from '../../../data/HÖÐR/operationData.json'; // 如果你有JSON文件

// --- 定义列配置 (这是你之前缺失的部分) ---
// 宽度直接在这里定义，不要去 CSS 里写 nth-child
const tableColumns = [
  { label: '日期', key: 'date', width: '20%' },
  { label: '时间', key: 'time', width: '20%' },
  { label: '事项', key: 'event', width: '20%' },
  { label: '操作者', key: 'operator', width: '20%' },
  { label: '详情', key: 'detail', width: '20%' },
];

const inputKeyword = ref(''); // 1. 新增：专门用来绑定输入框的临时变量
const searchKeyword = ref(''); // 2. 原变量：专门用来给计算属性做筛选

// 1. 初始化：排序 + 加状态
const processedData = ref(
  rawData
    .sort((a, b) => {
      const dateTimeA = String(a.date || '') + String(a.time || '');
      const dateTimeB = String(b.date || '') + String(b.time || '');
      return dateTimeB.localeCompare(dateTimeA);
    })
    .map((item) => {
      // ✅ 新增：在 map 之前先获取本地已解锁列表
      const storageKey = 'UNLOCKED_LIST';
      const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const itemIdentifier = `ModuleOperation_${item.event}`
        .trim()
        .toLowerCase();

      return {
        ...item,
        isExpanded: false,
        isUnlocked: unlockedList.includes(itemIdentifier),
        // ✅ 新增：把操作模块的特殊规则翻译成通用的 isAlert 信号
        isAlert: item.hint && String(item.hint).trim() !== '',
      };
    })
);

// ==========================================
// 跨模块监听联动逻辑
// ==========================================
// 1. 读取全局状态
const isEmailSent = ref(window.isEmailSent || false);
const isWindExecuted = ref(window.isWindExecuted || false); // ✅ 新增：WIND.exe 状态
const isPersonnelExported = ref(window.isPersonnelExported || false); // ✅ 新增：导出状态

// 2. 状态更新函数
const handleEmailSent = () => {
  isEmailSent.value = true;
};
const handleWindExecuted = () => {
  isWindExecuted.value = true; // ✅ 新增：接收到信号后更新为 true
};
const handlePersonnelExported = () => {
  isPersonnelExported.value = true;
}; // ✅ 新增：更新状态

// 3. 挂载与销毁监听
onMounted(() => {
  window.addEventListener('email-sent', handleEmailSent);
  window.addEventListener('wind-executed', handleWindExecuted); // ✅ 新增监听
  window.addEventListener('personnel-exported', handlePersonnelExported); // ✅ 新增：监听
});
onUnmounted(() => {
  window.removeEventListener('email-sent', handleEmailSent);
  window.removeEventListener('wind-executed', handleWindExecuted); // ✅ 移除监听
  window.removeEventListener('personnel-exported', handlePersonnelExported); // ✅ 移除监听
});

// 4. ✅ 数据过滤逻辑（核心）
const operationData = computed(() => {
  return processedData.value.filter((item) => {
    // 拦截 1：发邮件的隐藏数据
    if (item.date === '20730927' && item.time === '15:26:04') {
      return isEmailSent.value;
    }

    // ✅ 拦截 2：启动 WIND.exe 的隐藏数据
    if (item.date === '20730927' && item.time === '16:04:04') {
      return isWindExecuted.value; // 只有启动了 WIND.exe 才允许显示
    }

    // ✅ 拦截 3：导出可疑人员名单
    if (item.date === '20730927' && item.time === '17:25:04') {
      return isPersonnelExported.value; // 只有点击了确认导出才显示！
    }

    return true; // 其他常规数据一律放行显示
  });
});

//搜索回车确认
const handleEnter = () => {
  searchKeyword.value = inputKeyword.value;
};
// 2. 计算属性：负责 筛选 AND 截取
const filteredOperation = computed(() => {
  let result = operationData.value;
  // 第一步：如果有搜索词，先在完整数据里找
  if (searchKeyword.value) {
    result = result.filter(
      (operation) =>
        operation.date && operation.date.includes(searchKeyword.value)
    );
  }
  // 第二步：无论是否搜索，最后只显示结果的前15条
  return result.slice(0, 15);
});

// 弹窗控制逻辑 ---
const showPopup = ref(false);
const currentHint = ref('');
const currentPassword = ref('');
const currentQuery = ref('');
const targetRow = ref(null); // 记录当前正在操作哪一行
// 处理点击 [查看] 按钮
const handleRowClick = (row) => {
  if (row.isExpanded) {
    row.isExpanded = false;
    return;
  }
  if (row.isUnlocked) {
    row.isExpanded = true;
    return;
  }

  if (row.hint && row.hint !== '') {
    currentHint.value = String(row.hint || '');
    currentPassword.value = String(row.password || '');
    currentQuery.value = String(row.query || '');
    targetRow.value = row;
    showPopup.value = true;
  } else {
    // ✅ 修复：直接展开
    row.isExpanded = true;
  }
};
// 密码输入正确后的回调
const handleUnlock = () => {
  if (targetRow.value) {
    targetRow.value.isExpanded = true; // 展开该行
    // 可选：验证通过后，是否清空 hint？
    targetRow.value.isUnlocked = true;

    // ✅ 新增：永久化存储逻辑
    const storageKey = 'UNLOCKED_LIST';
    const itemIdentifier = `ModuleOperation_${targetRow.value.event}`
      .trim()
      .toLowerCase();

    const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!unlockedList.includes(itemIdentifier)) {
      unlockedList.push(itemIdentifier);
      localStorage.setItem(storageKey, JSON.stringify(unlockedList));
    }

    // 关键：每次成功解锁，都执行一次检查。一旦最后一根锁链断掉，就发射广播。
    checkAllUnlocked();
  }
};

// ✅ 新增：计算是否所有需要解锁的项都已解锁
const checkAllUnlocked = () => {
  // 逻辑：寻找是否还存在 [有密码] 且 [未解锁] 且 [不是那个特定时间点] 的行
  const stillHasLocked = processedData.value.some((item) => {
    // 1. 首先检查是否有密码且未解锁
    const needsUnlock =
      item.hint && item.hint.trim() !== '' && !item.isUnlocked;

    // 2. 检查这是否是我们要排除的那一条记录 (20730927 05:26:00)
    const isExcluded = item.date === '20730927' && item.time === '05:26:00';

    // 只有当“需要解锁”且“不是排除项”时，才认为它是一个阻碍广播的锁
    return needsUnlock && !isExcluded;
  });

  // 如果没有锁着的行了，说明“全部解锁”任务达成
  if (!stillHasLocked) {
    window.isAllOperationUnlocked = true; // 记录到全局变量
    window.dispatchEvent(new CustomEvent('all-operation-unlocked')); // 派发统一格式的事件
  }
};

// 在组件挂载时初始化状态
onMounted(() => {
  checkAllUnlocked(); // 初始化一次
  // ... 其他监听 ...
});
</script>

<style scoped>
/* --- 这里只放表格和搜索框的样式 --- */
/* 只要不加 scoped，父组件定义的 :root 变量（比如 --primary）这里依然能用 */
.module-operation {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 核心：彻底关掉浏览器最外层的滚动条 */
}

/* 仅保留特有的输入框宽度控制 */
.input {
  width: 200px;
}
.input:focus {
  width: 250px;
}

.detail-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 2. 新增：隐藏信息样式 */
.hidden-msg-area {
  margin-left: 20px; /* 离搜索框远一点 */
  position: relative;
  height: 20px; /* 占位高度 */
  display: flex;
  align-items: center;
}

.hidden-msg-text {
  opacity: 0; /* 默认看不见 */
  color: #ffffff;
  font-size: var(--text-hidden);
  letter-spacing: 1px;
  transition: opacity 0.8s ease-in-out; /* 缓慢浮现 */
}

/* 鼠标悬停在区域上时，文字浮现 */
.hidden-msg-area:hover .hidden-msg-text {
  opacity: 1;
}
</style>
