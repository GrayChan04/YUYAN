<template>
  <!-- 人员监控 -->
  <div class="module-personnel HÖÐR">
    <!-- ========================================== -->
    <!-- 视图 A：列表界面 (当没有选中人员时显示) -->
    <!-- ========================================== -->
    <template v-if="!selectedPersonnel">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <span class="search-label">>></span>
        <input
          type="text"
          v-model="inputKeyword"
          @keydown.enter="handleEnter"
          placeholder="输入警告状态、IP地址或昵称搜索"
          class="input"
        />
        <!-- ✅ 新增：工具按钮组 -->
        <div class="tool-group">
          <!-- 导出按钮 -->
          <button
            class="tool-btn"
            :disabled="!isExportEnabled"
            @click="handleExport"
          >
            导出
          </button>
        </div>
      </div>

      <!-- 数据表格 -->
      <HÖÐRTable :columns="tableColumns" :data="filteredPersonnel">
        <!-- 详情列：点击进入独立界面 -->
        <template #detail="{ row }">
          <span class="view-btn" @click="handleRowClick(row)">查看</span>
        </template>
        <!-- ✅ 注意：彻底删除了 #expand 插槽，因为不需要在表格内展开了 -->
      </HÖÐRTable>
    </template>

    <!-- ========================================== -->
    <!-- 视图 B：独立详情界面 (当选中人员时显示) -->
    <!-- ========================================== -->
    <template v-else>
      <div class="detail-wrapper">
        <!-- 顶部：标题与返回按钮 -->
        <div class="detail-header">
          <div class="search-label breadcrumb-nav">
            <span>>> </span>
            <!-- ✅ 只给前面这部分加点击事件和特殊样式 -->
            <span class="clickable-text" @click="goBack" style="cursor: pointer"
              >人员监控</span
            >
            <span> > {{ selectedPersonnel.nick_name }}</span>
          </div>
          <!-- ✅ 右上角的返回按钮 -->
          <button class="tool-btn" @click="goBack">返回列表</button>
        </div>

        <!-- 档案内容区 -->
        <div class="detail-body">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">昵&emsp;&emsp;称：</span>
              <span class="info-value">{{ selectedPersonnel.nick_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">真实姓名：</span>
              <!-- ✅ 未编辑时显示纯文本，编辑时显示输入框 -->
              <span v-if="!isEditing" class="info-value">{{
                selectedPersonnel.real_name
              }}</span>
              <input
                v-else
                type="text"
                class="edit-input"
                v-model="selectedPersonnel.real_name"
              />
            </div>
          </div>

          <!-- 第二行：教育程度 和 个人工号 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">教育程度：</span>
              <span class="info-value">{{ selectedPersonnel.education }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">个人工号：</span>
              <span class="info-value">{{ selectedPersonnel.account }}</span>
            </div>
          </div>

          <!-- 第三行：在职状态和IP地址 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">在职状态：</span>
              <span class="info-value">{{ selectedPersonnel.employed }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">IP&emsp;地址：</span>
              <span
                class="info-value"
                :class="{
                  'line-through': selectedPersonnel.employed === '离职',
                }"
              >
                {{ selectedPersonnel.ip_address }}
              </span>
            </div>
          </div>

          <!-- 第四行：告警状态 -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">告警状态：</span>
              <!-- ✅ 未编辑时显示纯文本，编辑时显示输入框 -->
              <span
                v-if="!isEditing"
                class="info-value"
                :class="{
                  'alert-text':
                    selectedPersonnel.alert == '可疑' &&
                    selectedPersonnel.alert !== '',
                }"
              >
                {{ selectedPersonnel.alert || '无' }}
              </span>
              <input
                v-else
                type="text"
                class="edit-input"
                v-model="selectedPersonnel.alert"
              />
            </div>
          </div>

          <!-- ✅ 新增：编辑与保存按钮行 (放在详细记录上面) -->
          <div class="action-row">
            <!-- 处于编辑状态时，编辑按钮被禁用 -->
            <button class="tool-btn" :disabled="isEditing" @click="startEdit">
              编辑
            </button>
            <!-- 处于非编辑状态时，保存按钮被禁用 -->
            <button class="tool-btn" :disabled="!isEditing" @click="saveEdit">
              保存
            </button>
          </div>

          <div
            class="info-row"
            style="flex-direction: column; gap: 10px; margin-top: 20px"
          >
            <span class="info-label" style="width: 100%">详细记录</span>
            <!-- 这里可以放具体的详情文本，使用 pre-wrap 保证换行 -->
            <div class="detail-text-block">
              <!-- ✅ 分支 A：如果存在 post_urls 且有数据，渲染成超链接列表 -->
              <template
                v-if="
                  selectedPersonnel.post_urls &&
                  selectedPersonnel.post_urls.length > 0
                "
              >
                <ul class="post-url-list">
                  <li
                    v-for="(url, index) in selectedPersonnel.post_urls"
                    :key="index"
                  >
                    <!-- :href 绑定跳转链接，target="_blank" 表示在新标签页打开 -->
                    <a :href="url" target="_blank" class="post-link">
                      <span class="link-text">{{ url }}</span>
                    </a>
                  </li>
                </ul>
              </template>

              <!-- ✅ 分支 B：如果没有 post_urls，依然显示原本的普通文本 -->
              <template v-else>
                {{
                  selectedPersonnel.content ||
                  selectedPersonnel.detail ||
                  '暂无详细记录...'
                }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- ✅ 新增：放置文档阅读器弹窗 -->
    <HÖÐRDoc
      v-model:visible="showDoc"
      :title="currentDocTitle"
      :content="currentDocContent"
      :show-footer="true"
      confirmText="确认导出"
      @confirm="handleConfirmExport"
      @cancel="showDoc = false"
    />
    <Toast ref="toastRef" class="HÖÐR" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import HÖÐRTable from '../HÖÐRTable.vue';
import Toast from '../../../components/common/BaseToast.vue';
import rawData from '../../../data/HÖÐR/personnelData.json';
import ISSCBList from '../../../data/HÖÐR/ISSCBList.json';
import HÖÐRDoc from '../HÖÐRDoc.vue'; // ✅ 新增：引入文档阅读器
import documentData from '../../../data/HÖÐR/documentData.json'; // ✅ 新增：引入文档数据集

const tableColumns = [
  { label: '告警状态', key: 'alert', width: '25%' },
  { label: 'IP地址', key: 'ip_address', width: '25%' },
  { label: '昵称', key: 'nick_name', width: '25%' },
  { label: '操作', key: 'detail', width: '25%' }, // 稍微调整了宽度占比
];

const inputKeyword = ref('');
const searchKeyword = ref('');
const toastRef = ref(null);

// ✅ 核心新增：用于记录当前点击了哪个人员
const selectedPersonnel = ref(null);

// ✅ 2. 提取 2073 年的名单数组
const list2073 = ISSCBList.find((item) => item.year === '2073');
// 如果找到了就取 list，没找到就给个空数组防报错
const targetNames = list2073 ? list2073.list : [];

// ✅ 3. 数据初始化：排序 + 数据清洗 + 答案备份
const processedData = [...rawData]
  .sort((a, b) => {
    const ipA = String(a.ip_address || '');
    const ipB = String(b.ip_address || '');
    return ipA.localeCompare(ipB, undefined, { numeric: true });
  })
  .map((item) => {
    // --- 数据持久化与初始化 ---
    const cacheKey = 'PERSONNEL_DATA_CACHE';
    const cachedData = JSON.parse(localStorage.getItem(cacheKey) || '{}');

    let modifiedItem = { ...item };
    const isTarget = targetNames.includes(String(item.real_name || ''));

    // ✅ 核心：锁定永久变红状态 (初始为未验证即变红)
    const shouldBeRed = isTarget || String(item.alert).trim() === '未验证';

    // ✅ 恢复编辑痕迹
    const myCache = cachedData[item.ip_address];
    if (myCache) {
      modifiedItem = { ...modifiedItem, ...myCache };
    } else {
      if (isTarget) {
        modifiedItem.alert = '未验证';
        modifiedItem.employed = '';
        modifiedItem.education = '';
        modifiedItem.account = '';
        modifiedItem.real_name = '';
      }
      // 随机抹除逻辑
      if (
        String(modifiedItem.alert).trim() === '未验证' &&
        Math.random() < 0.4
      ) {
        modifiedItem.real_name = '';
        modifiedItem.employed = '';
        modifiedItem.education = '';
        modifiedItem.account = '';
      }
    }

    return {
      ...modifiedItem,
      isTarget: isTarget,
      correct_real_name: item.real_name,
      initial_education: item.education,
      initial_account: item.account,
      initial_employed: item.employed,
      initial_alert: isTarget ? '未验证' : item.alert,
      isAlert: shouldBeRed, // ✅ 锁定此标志，不受后续编辑影响
    };
  })
  .filter((item) => item.alert && String(item.alert).trim() !== '');

// ==========================================
// 跨模块监听联动逻辑
// ==========================================
// 1. 读取全局初始状态
const isEmailSent = ref(window.isEmailSent || false);
const isWindExecuted = ref(window.isWindExecuted || false);
const isAllOperationUnlocked = ref(window.isAllOperationUnlocked || false); // ✅ 新增：操作模块状态

// 2. 状态更新函数
const handleEmailSent = () => {
  isEmailSent.value = true;
};
const handleWindExecuted = () => {
  isWindExecuted.value = true;
};
const handleOperationUnlocked = () => {
  isAllOperationUnlocked.value = true;
}; // ✅ 新增：接收信号

// 3. 挂载与销毁监听
onMounted(() => {
  window.addEventListener('email-sent', handleEmailSent);
  window.addEventListener('wind-executed', handleWindExecuted);
  window.addEventListener('all-operation-unlocked', handleOperationUnlocked); // ✅ 新增监听
});
onUnmounted(() => {
  window.removeEventListener('email-sent', handleEmailSent);
  window.removeEventListener('wind-executed', handleWindExecuted);
  window.removeEventListener('all-operation-unlocked', handleOperationUnlocked); // ✅ 移除监听
});

const personnelData = ref(processedData);

const handleEnter = () => {
  searchKeyword.value = inputKeyword.value;
};

const filteredPersonnel = computed(() => {
  let result = personnelData.value;
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    result = result.filter((p) => {
      const alertMatch = p.alert && p.alert.toLowerCase().includes(keyword);
      const ipMatch =
        p.ip_address && p.ip_address.toLowerCase().includes(keyword);
      const nickMatch =
        p.nick_name && p.nick_name.toLowerCase().includes(keyword);
      return alertMatch || ipMatch || nickMatch;
    });
  }
  return result;
});

// 找到原本的 handleRowClick，每次打开档案时强制重置为不可编辑
const handleRowClick = (row) => {
  selectedPersonnel.value = row;
  isEditing.value = false; // ✅ 新增这行
};

// 找到原本的 goBack，返回时也重置
const goBack = () => {
  selectedPersonnel.value = null;
  isEditing.value = false; // ✅ 新增这行
};

// ✅ 核心新增：控制编辑状态的开关
const isEditing = ref(false);

const startEdit = () => {
  isEditing.value = true;
};

const saveEdit = () => {
  isEditing.value = false;

  let justUnlocked = false;

  if (selectedPersonnel.value) {
    const inputName = String(selectedPersonnel.value.real_name).trim();
    const correctName = String(
      selectedPersonnel.value.correct_real_name
    ).trim();

    if (inputName === '') {
      selectedPersonnel.value.employed = '';
      selectedPersonnel.value.education = '';
      selectedPersonnel.value.account = '';
    } else if (correctName !== '' && inputName === correctName) {
      selectedPersonnel.value.employed =
        selectedPersonnel.value.initial_employed;
      selectedPersonnel.value.education =
        selectedPersonnel.value.initial_education;
      selectedPersonnel.value.account = selectedPersonnel.value.initial_account;
    }
  }

  // ✅ 持久化
  const cacheKey = 'PERSONNEL_DATA_CACHE';
  const cachedData = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  cachedData[selectedPersonnel.value.ip_address] = {
    real_name: selectedPersonnel.value.real_name,
    alert: selectedPersonnel.value.alert,
    employed: selectedPersonnel.value.employed,
    education: selectedPersonnel.value.education,
    account: selectedPersonnel.value.account,
  };
  localStorage.setItem(cacheKey, JSON.stringify(cachedData));

  // ✅ 先判断是否这一步触发了解锁
  if (isAllCorrect.value && !isExportUnlocked.value) {
    isExportUnlocked.value = true;
    justUnlocked = true;
  }

  // ✅ 第一个 toast：立即显示
  if (toastRef.value) {
    toastRef.value.show('信息已更新');
  }

  // ✅ 第二个 toast：延迟显示（关键）
  if (justUnlocked) {
    setTimeout(() => {
      if (toastRef.value) {
        toastRef.value.show('导出功能已恢复');
      }

      // 再返回列表（保证用户看到提示）
      selectedPersonnel.value = null;
    }, 2000);
  }
};

const isExportUnlocked = ref(false);
// 原始判定（是否全部完成）
const isAllCorrect = computed(() => {
  return personnelData.value.every((p) => {
    if (p.isTarget) {
      return p.real_name === p.correct_real_name && p.alert === '可疑';
    } else {
      if (p.initial_alert === '未验证') {
        return p.alert === '未验证';
      }
      return true;
    }
  });
});

// ✅ 真正控制按钮的
const isExportEnabled = computed(() => {
  return isExportUnlocked.value;
});

// 点击导出的函数
const showDoc = ref(false);
const currentDocTitle = ref('');
const currentDocContent = ref('');

const handleExport = () => {
  if (!isExportEnabled.value) return; // 没满足条件直接拦截

  // ✅ 现在的逻辑完全一致了：全部使用本地 ref 变量判断
  if (
    !isEmailSent.value ||
    !isWindExecuted.value ||
    !isAllOperationUnlocked.value
  ) {
    let missingModules = [];

    if (!isEmailSent.value) missingModules.push('邮件管理');
    if (!isWindExecuted.value) missingModules.push('程序执行');
    if (!isAllOperationUnlocked.value) missingModules.push('操作日志');

    if (toastRef.value) {
      toastRef.value.show(
        `未通过执行操作验证：\n• ${missingModules.join('\n• ')}`
      );
    }
    return;
  }

  // 从 JSON 中寻找刚才生成的名单数据
  const fileName = '可疑人员名单报告.pdf';
  const targetDoc = documentData.find((doc) => doc.file_name === fileName);

  currentDocTitle.value = fileName;
  currentDocContent.value = targetDoc
    ? targetDoc.content
    : `<p style="color: var(--red-alert);">[ ERROR: 找不到名单数据 ]</p>`;

  showDoc.value = true; // 显示弹窗
};

// 2. 点击 PDF 弹窗右下角的[ 确认导出 ] 时：
const handleConfirmExport = () => {
  showDoc.value = false;

  // 弹出系统提示
  if (toastRef.value) {
    toastRef.value.show('可疑人员名单报告已成功导出');
  }

  // ✅ 核心魔法：记录全局状态，并发射广播给操作日志模块
  window.isPersonnelExported = true;
  window.dispatchEvent(new CustomEvent('personnel-exported'));
};
</script>

<style scoped>
.module-personnel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 核心：彻底关掉浏览器最外层的滚动条 */
}

/* 仅保留特有的输入框宽度控制 */
.input {
  width: 300px;
}
.input:focus {
  width: 350px;
}

/* 仅保留工具组靠右排列特性 */
.tool-group {
  display: flex;
  gap: 10px;
  margin-left: auto;
  align-items: center;
}

/* --- 独立详情界面样式 --- */
.detail-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

/* --- 独立详情界面顶部 --- */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* ✅ 统一内外边距和最小高度，保证切换时文字绝对不跳动 */
  min-height: 40px;
  padding-bottom: 10px;
  margin-bottom: 20px;
  border-bottom: 1px dashed var(--bg-mask); /* 统一改成虚线视觉上更连贯 */
}

.detail-body {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  font-size: var(--text-base);
}

/* ✅ 新增：让每个项目各自平分 50% 的宽度 */
.info-item {
  flex: 1;
  display: flex;
  align-items: center; /* 从 flex-start 改为 center，让基线对齐 */
  min-height: 30px; /* 锁定一个最小高度，这样切换时容器不会被撑高 */
}

.info-label {
  color: var(--primary);
  width: 90px; /* ✅ 因为变成两列了，标签宽度可以稍微改小一点防止拥挤 */
  flex-shrink: 0;
  opacity: 0.8;
}
/* ✅ 新增：专门针对两列数据进行右对齐优化 */
.info-item .info-label {
  text-align: justify; /* 核心魔法：让文字靠右，这样所有的冒号就排成了一条绝对整齐的竖线 */
  margin-right: 5px; /* 给冒号和数值之间留下固定的、一模一样的间距 */
  text-align-last: justify;
}

.info-value {
  color: #fff;
  flex: 1;
  word-break: break-all; /* 防止长IP地址撑破布局 */
  font-size: var(--text-base);
}

.detail-text-block {
  width: 100%;
  color: #ddd;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--bg-panel);
  padding: 15px;
  font-size: var(--text-base);
}

.alert-text {
  color: var(--red-alert);
  font-weight: bold;
}

/* --- ✅ 新增：档案基础信息操作行 --- */
.action-row {
  display: flex;
  justify-content: flex-end; /* 让按钮靠右对齐 */
  gap: 15px;
  width: 100%;
  margin-top: 5px;
  padding-bottom: 15px;
  border-bottom: 1px dashed var(--bg-mask); /* 增加一条微弱的底线和详情隔开 */
}

/* --- ✅ 新增：编辑状态的输入框样式 --- */
.edit-input {
  flex: 1;
  background: var(--bg-panel);
  border: var(--border-one); /* 极细的上左右边框 */
  border-bottom: var(--border-base); /* 加粗的底部输入线 */
  color: var(--primary); /* 建议编辑时文字变亮绿色，视觉反馈更好 */
  font-size: var(--text-base); /* ✅ 关键：和原本纯文本保持绝对一致的大小 */
  padding: 5px 5px; /* 输入框留一点内边距让文字不贴边 */

  /* ✅ 核心魔法：向左拉回 7px 
     (因为左边框占 1px，左内边距占 6px，所以 -7px 刚好让里面的字和原来分毫不差) */
  margin-left: -6px;

  outline: none;
  max-width: 160px;
  transition: all 0.3s;
}

.edit-input:focus {
  background: var(--bg-panel);
  box-shadow: 0 0 5px var(--bg-mask);
}

/* 让按钮组靠右排列，或者紧跟在隐藏文字后面 */
.tool-group {
  display: flex;
  gap: 10px;
  margin-left: auto; /* 这一行会让按钮组自动推到最右边 */
  align-items: center;
}

/* --- ✅ 新增：发帖链接列表样式 --- */
.post-url-list {
  list-style: none; /* 去除列表默认的圆点 */
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px; /* 链接上下之间的间距 */
}

.post-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent; /* 透明边框占位，防止悬停时跳动 */
  border-left: var(--border-left); /* 左侧加粗的亮绿高亮线 */
  padding: 5px 10px;
  color: var(--primary);
  text-decoration: none; /* 去除原生的下划线 */
  font-size: var(--text-base);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 丝滑的过渡曲线 */
  width: fit-content; /* 宽度贴合内容 */
}

.link-text {
  letter-spacing: 2px;
}

/* 鼠标悬停时的黑客风交互特效 */
.post-link:hover {
  background: var(--bg-panel); /* 背景变亮 */
  border-left: var(--border-left);
  transform: translateX(8px); /* 整个链接块向右平移，交互感极强 */
  box-shadow: 0 0 10px var(--bg-mask);
}

/* 点击按压效果 */
.post-link:active {
  transform: translateX(4px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ✅ 新增：离职人员 IP 划线样式 */
.line-through {
  text-decoration: line-through;
  opacity: 0.6;
  color: var(--primary) !important; /* 离职状态用红色划线提醒 */
}
</style>
