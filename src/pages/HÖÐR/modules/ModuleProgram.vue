<template>
  <!-- 执行程序 -->
  <div class="module-program HÖÐR">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <span class="search-label">>></span>
      <input
        type="text"
        v-model="inputKeyword"
        @keydown.enter="handleEnter"
        placeholder="输入名称搜索"
        class="input"
      />
    </div>

    <!-- 数据表格 -->
    <!-- 【使用通用表格组件】 -->
    <HÖÐRTable :columns="tableColumns" :data="filteredProgram">
      <!-- 新增：展开后的内容区域 -->
      <!-- 这里对应 HÖÐRTable 里的 slot name="expand" -->
      <template #expand="{ row }">
        <!-- 空，不显示任何内容 -->
      </template>
      <template #name="{ row }">
        <!-- ✅ 修改：只允许 WIND.exe 触发点击事件，并且只有它拥有悬停手型光标 -->
        <span
          class="program-name"
          @click.stop="row.name === 'WIND.exe' ? handleRowClick(row) : null"
          :class="{ clickable: row.name === 'WIND.exe' }"
        >
          {{ row.name }}
        </span>
      </template>
    </HÖÐRTable>
    <Popup
      v-model:visible="showPopup"
      class="HÖÐR"
      :title="popupTitle"
      :hint="currentHint"
      :correct-password="currentPassword"
      :correct-password2="currentPassword2"
      :correct-query="currentQuery"
      :silent-error="isSilent"
      :mode="popupMode"
      @success="handlePopupSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import HÖÐRTable from '../HÖÐRTable.vue';
import Popup from '../../../components/common/BasePopup.vue';
import rawData from '../../../data/HÖÐR/programData.json';
import windVerifyData from '../../../data/HÖÐR/WINDVerify.json';
import windRunData from '../../../data/HÖÐR/WINDRun.json';

// --- 表格列配置 ---
const tableColumns = [
  { label: '名称', key: 'name', width: '20%' },
  { label: '创建时间', key: 'created_time', width: '20%' },
  { label: '修改时间', key: 'modified_time', width: '20%' },
  { label: '类型', key: 'type', width: '20%' },
  { label: '大小', key: 'size', width: '20%' },
];

const inputKeyword = ref('');
const searchKeyword = ref('');

// --- 初始化数据，增加 unlockStage ---
const processedData = [...rawData]
  .sort((a, b) => {
    const nameCompare = b.name.localeCompare(a.name);
    if (nameCompare !== 0) return nameCompare;
    return new Date(b.created_time) - new Date(a.created_time);
  })
  .map((item) => {
    const storageKey = 'UNLOCKED_LIST'; // 使用专用 Key 存储阶段数值
    const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const itemIdentifier = `ModuleProgram_${item.name}`.trim().toLowerCase();

    // ✅ 探测逻辑：从最高阶段 3 开始往回找
    let currentStage = 0;
    const baseId = `ModuleProgram_${item.name}`.trim().toLowerCase();

    if (unlockedList.includes(`${baseId}_stage_3`)) {
      currentStage = 3;
    } else if (unlockedList.includes(`${baseId}_stage_2`)) {
      currentStage = 2;
    } else if (unlockedList.includes(`${baseId}_stage_1`)) {
      currentStage = 1;
    }

    return {
      ...item,
      unlockStage: currentStage, // 0: 未解锁, 1: password1/password2完成, 2: windVerify完成, 3: 链接验证完成
      // ✅ 新增：把程序模块的特殊规则翻译成通用的 isAlert 信号
      isAlert: Array.isArray(item.password) && item.password.length > 0,
    };
  });

const operationData = ref(processedData);

// --- 计算属性筛选 ---
const filteredProgram = computed(() => {
  let result = [...operationData.value];
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.trim();
    result = result.filter((item) => {
      const nameMatch = item.name && item.name.includes(keyword);
      const timeMatch =
        item.created_time &&
        item.created_time.toLowerCase().includes(keyword.toLowerCase());
      return nameMatch || timeMatch;
    });
  }
  result.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
  });
  return result.slice(0, 15);
});

// --- 弹窗控制 ---
const showPopup = ref(false);
const popupMode = ref('passwordOnly');
const popupTitle = ref('');
const currentHint = ref('');
const currentPassword = ref('');
const currentPassword2 = ref('');
const currentQuery = ref('');
const isSilent = ref(false);
const targetRow = ref(null);

// --- 点击行处理，根据 unlockStage 自动跳转 ---
const handleRowClick = (row) => {
  targetRow.value = row;

  if (row.unlockStage === 0) {
    // 第一阶段：访问认证
    showPopupForStage(0);
  } else if (row.unlockStage === 1) {
    // 第二阶段：windVerify 或链接验证（password1 直接到链接验证）
    showPopupForStage(1);
  } else if (row.unlockStage === 2) {
    // 链接验证
    showPopupForStage(2);
  } else if (row.unlockStage === 3) {
    // 完全解锁
    window.dispatchEvent(
      new CustomEvent('unlock-chat', { detail: { programName: row.name } })
    );
  }
};

// --- 封装阶段弹窗显示 ---
const showPopupForStage = (stage) => {
  const row = targetRow.value;
  if (stage === 0) {
    popupMode.value = row.query ? 'query+password' : 'passwordOnly';
    currentPassword.value = row.password[0] || '';
    currentPassword2.value = row.password[1] || '';
    currentQuery.value = row.query || '';
    popupTitle.value = '访问认证';
    currentHint.value = row.hint || '';
    isSilent.value = false;
    showPopup.value = true;
  } else if (stage === 1) {
    // 二次验证阶段（windVerify）
    popupMode.value = 'singleVerify';
    currentPassword.value = windVerifyData[0].password;
    currentPassword2.value = '';
    currentHint.value = windVerifyData[0].hint;
    popupTitle.value = row.name;
    isSilent.value = false;
    showPopup.value = true;
  } else if (stage === 2) {
    // 链接验证阶段
    popupMode.value = 'singleVerify';
    currentPassword.value = windRunData[0].password;
    currentPassword2.value = '';
    currentHint.value = windRunData[0].hint;
    popupTitle.value = row.name;
    isSilent.value = true;
    showPopup.value = true;
  }
};

// ✅ 新增：保存阶段的辅助函数
const saveStage = (name, stage) => {
  const storageKey = 'UNLOCKED_LIST';
  const itemIdentifier = `ModuleProgram_${name}_STAGE_${stage}`
    .trim()
    .toLowerCase();

  const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!unlockedList.includes(itemIdentifier)) {
    unlockedList.push(itemIdentifier);
    localStorage.setItem(storageKey, JSON.stringify(unlockedList));
  }
};

// --- 弹窗验证成功后更新 unlockStage ---
const handlePopupSuccess = (payload) => {
  showPopup.value = false;
  const row = targetRow.value;

  if (
    popupMode.value === 'passwordOnly' ||
    popupMode.value === 'query+password'
  ) {
    if (payload === 'pass2' && currentPassword2.value) {
      row.unlockStage = 1; // password2完成
      saveStage(row.name, 1);
      setTimeout(() => showPopupForStage(1), 300);
    } else if (payload === 'pass1') {
      row.unlockStage = 2; // password1直接跳链接验证
      saveStage(row.name, 2);
      setTimeout(() => showPopupForStage(2), 300);
    }
  } else if (popupMode.value === 'singleVerify' && !isSilent.value) {
    // windVerify 完成
    row.unlockStage = 2;
    saveStage(row.name, 2);
    setTimeout(() => showPopupForStage(2), 300);
  } else if (popupMode.value === 'singleVerify' && isSilent.value) {
    // 链接验证完成
    row.unlockStage = 3;
    saveStage(row.name, 3);
    window.dispatchEvent(
      new CustomEvent('unlock-chat', { detail: { programName: row.name } })
    );
    window.isWindExecuted = true;
    window.dispatchEvent(new CustomEvent('wind-executed'));
  }
};
</script>

<style scoped>
/* --- 这里只放表格和搜索框的样式 --- */
/* 只要不加 scoped，父组件定义的 :root 变量（比如 --primary）这里依然能用 */
.module-program {
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

.program-name {
  color: #ffffff;
  transition: all 0.3s;
}

/* 只有符合条件的才显示手型光标 */
.program-name.clickable {
  cursor: pointer;
}

.program-name.clickable:hover {
  text-decoration: underline; /* 可选，增加交互感 */
}
</style>
