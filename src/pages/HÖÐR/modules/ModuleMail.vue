<template>
  <!-- 邮件管理 -->
  <div class="module-mail HÖÐR">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <span class="search-label">>></span>
      <input
        type="text"
        v-model="inputKeyword"
        @keydown.enter="handleEnter"
        placeholder="输入邮件状态、日期或标题内容搜索"
        class="input"
      />
      <!-- 新增：隐藏信息区域 -->
      <div class="hidden-msg-area">
        <span class="hidden-msg-text">RSA PKCS#1</span>
      </div>
      <!-- ✅ 新增：工具按钮组 -->
      <div class="tool-group">
        <!-- KEY 1按钮 -->
        <button class="tool-btn" @click="copyKey('KEY1')">KEY 1</button>
        <!-- KEY 2按钮 -->
        <button class="tool-btn" @click="copyKey('KEY2')">KEY 2</button>
        <!-- 写邮件 (假按钮) -->
        <button class="tool-btn">写邮件</button>
      </div>
    </div>

    <!-- 数据表格 -->
    <!-- 【使用通用表格组件】 -->
    <HÖÐRTable :columns="tableColumns" :data="filteredMail">
      <template #detail="{ row }">
        <span class="view-btn" @click="handleRowClick(row)">
          {{ row.isExpanded ? '收起' : '查看' }}
        </span>
      </template>
      <!-- 新增：展开后的内容区域 -->
      <!-- 这里对应 HÖÐRTable 里的 slot name="expand" -->
      <template #expand="{ row }">
        <div class="expand-content">
          <!-- ✅ 分支 A：未解锁且有 Hint -> 显示输入框 -->
          <div v-if="!row.isUnlocked && row.hint" class="unlock-panel">
            <div class="unlock-input-wrapper">
              <textarea
                type="text"
                :placeholder="row.hint"
                v-model="row.inputAttempt"
                class="inline-input"
                @keydown.enter="sendMail(row)"
              ></textarea>
              <button class="tool-btn" @click="sendMail(row)">发送</button>
            </div>
          </div>

          <!-- ✅ 分支 B：已解锁 -> 显示你原来的邮件内容 (完全保留你的结构) -->
          <template v-else>
            <!-- 上半部分：邮件正文 -->
            <div class="mail-content">
              <p>{{ row.content }}</p>
            </div>
            <!-- 下半部分：附件区域 -->
            <div
              class="mail-attachment"
              v-if="row.attachment && row.attachment !== ''"
            >
              <div class="attachment-label">>> 附件：</div>
              <div class="attachment-list">
                <span
                  class="attachment-item"
                  @click="openAttachment(row.attachment)"
                >
                  {{ row.attachment }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </template>
    </HÖÐRTable>
    <!-- ✅ 新增：放置文档阅读器弹窗组件 -->
    <HÖÐRDoc
      v-for="doc in activeDocs"
      :key="doc.id"
      :visible="true"
      :title="doc.title"
      :content="doc.content"
      :show-footer="false"
      @update:visible="closeDocument(doc.id)"
      @confirm="closeDocument(doc.id)"
      @cancel="closeDocument(doc.id)"
    />
    <!-- ✅ 4. 放置提示组件，绑定 ref -->
    <Toast ref="toastRef" class="HÖÐR" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import HÖÐRTable from '../HÖÐRTable.vue'; // 引入组件
import Toast from '../../../components/common/BaseToast.vue';
import HÖÐRDoc from '../HÖÐRDoc.vue';
import rawData from '../../../data/HÖÐR/mailData.json'; // 如果你有JSON文件
import documentData from '../../../data/HÖÐR/documentData.json';

// --- 定义列配置 (这是你之前缺失的部分) ---
// 宽度直接在这里定义，不要去 CSS 里写 nth-child
const tableColumns = [
  { label: '邮件状态', key: 'status', width: '10%' },
  { label: '发件人', key: 'sender', width: '20%' },
  { label: '收件人', key: 'receiver', width: '20%' },
  { label: '时间', key: 'time', width: '20%' },
  { label: '标题', key: 'title', width: '20%' },
  { label: '详情', key: 'detail', width: '10%' },
];

const inputKeyword = ref(''); // 1. 新增：专门用来绑定输入框的临时变量
const searchKeyword = ref(''); // 2. 原变量：专门用来给计算属性做筛选

// 1. 初始化：排序 + 加状态 (保留所有数据！)
const processedData = [...rawData]
  .sort((a, b) => {
    const timeCompare = b.time.localeCompare(a.time);
    if (timeCompare !== 0) return timeCompare;
  })
  .map((item) => {
    // ✅ 新增：在 map 之前先获取本地已解锁列表
    const storageKey = 'UNLOCKED_LIST';
    const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const itemIdentifier = `ModuleMail_${item.title}`.trim().toLowerCase();

    return {
      ...item,
      isExpanded: false,
      //isUnlocked: false,
      isUnlocked: unlockedList.includes(itemIdentifier),
      inputAttempt: '',
      // ✅ 新增：把操作模块的特殊规则翻译成通用的 isAlert 信号
      isAlert: item.status && String(item.status).trim() == '待发送',
      status: unlockedList.includes(itemIdentifier) ? '已发送' : item.status,
    };
  });

// 将完整数据赋值给响应式变量
const mailData = ref(processedData);
//搜索回车确认
const handleEnter = () => {
  searchKeyword.value = inputKeyword.value;
};
// 2. 计算属性：负责 筛选 AND 截取
const filteredMail = computed(() => {
  let result = mailData.value;

  // 第一步：如果有搜索词
  if (searchKeyword.value) {
    // 将搜索词去空格并转小写，实现模糊搜索
    const keyword = searchKeyword.value.trim().toLowerCase();
    result = result.filter((mail) => {
      // 1. 匹配日期 (先判断字段是否存在，再转小写匹配)
      const dateMatch = mail.time && mail.time.toLowerCase().includes(keyword);
      // 2. 匹配标题 (先判断字段是否存在，再转小写匹配)
      const titleMatch =
        mail.title && mail.title.toLowerCase().includes(keyword);
      // 2. 匹配标题 (先判断字段是否存在，再转小写匹配)
      const statusMatch =
        mail.status && mail.status.toLowerCase().includes(keyword);
      // ✅ 逻辑或 (||)：只要日期对上了 或者 标题对上了，都保留
      return dateMatch || titleMatch || statusMatch;
    });
  }
  // 第二步：无论是否搜索，最后只显示结果的前15条
  return result.slice(0, 15);
});

// 处理点击 [查看] 按钮
const handleRowClick = (row) => {
  // 核心修改：不再判断 hint 去弹窗，而是单纯地切换展开/收起
  // 展开后，由 Template 里的 v-if 来决定是显示输入框还是显示邮件内容
  row.isExpanded = !row.isExpanded;

  // 每次打开时，重置一下输入状态（可选）
  if (row.isExpanded) {
    row.inputAttempt = '';
  }
};

// --- ✅ 新增：密钥数据与复制逻辑 ---

// 模拟的密钥数据
const MY_PUBLIC_KEY = `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCp7tBKe9xficQ0Ox1x4HR5qgFGLlMEW+ZMT9pDdat4nRvSW10zg+Bgw1CuX4o3hZ3WkCnMDWKuj+7hu+2/oeh87QLqk3Ab8wmWqEgsM9faeHn8CFX0+P7ssMJmTK+3aw4fMKKd/Wx8kik+fIHjE6aawIQSKOxf+i65+jIQpydJ1QIDAQAB`;

const MY_PRIVATE_KEY = `MIICXgIBAAKBgQCp7tBKe9xficQ0Ox1x4HR5qgFGLlMEW+ZMT9pDdat4nRvSW10zg+Bgw1CuX4o3hZ3WkCnMDWKuj+7hu+2/oeh87QLqk3Ab8wmWqEgsM9faeHn8CFX0+P7ssMJmTK+3aw4fMKKd/Wx8kik+fIHjE6aawIQSKOxf+i65+jIQpydJ1QIDAQABAoGAAmsYTRcPfySSGumEdRcWppdEHAroujUnRTVrC8QO7qZ9u4lP/ZMGNxpQeaAjyBUqC+BSrUlmJXR9l895hgf4gQNGuOjSWmfzAM/G0XiPT2q/Rj69NrdY9sX5WXpWdxCTL2h+stSLOZv0MCEetHvo7ljA0UsBod0ZgTNbzxKpWPkCQQD2j/13viOzYfA2I2SpxRXE3ec6OOCxEpo7UrvOyWI8ttFUpnZoib2qwpnyvn5XrECIVMUFAcvdjD2qw7nZkBtfAkEAsG/yij1AoPvMee5FyeeW8FrZJbr22U2jcqhcE2qdLP3T5OwNziVPsI9tGYuw3xbT/jlaXR7bdY6j9vQq8JvbSwJBAN6KeCxr4a026Kj0qRbSXCOkZd+XFra8I5kHw5uRCKnkGGxfEuCn8hj+LBV8+mwHfPeQC4PJa0g8HCzVHBnSh+ECQQCTzPOsgitFsClWaxfjTzHOHwyQ4tIury8guZCIY2NPcUK0HlpiOjdLfJq0L6T2/TSRXpIoN9U34UnRcjEWZjmJAkEA0mTI92p6QZkDDL0h7fDCzPXa+sYV1HunwpCPz9MT/qPM/SY5vF1KPlW/WpdbVn9w4Oo9SmA3YLTN2ai64LLrog==`;

const toastRef = ref(null);

// 复制函数
const copyKey = async (type) => {
  const text = type === 'KEY1' ? MY_PUBLIC_KEY : MY_PRIVATE_KEY;

  try {
    // 使用浏览器原生 API 复制到剪贴板
    await navigator.clipboard.writeText(text);
    // 这里可以加一个简单的 alert 或者 console 提示
    // alert(`${type === 'public' ? 'KEY 1' : 'KEY 2'} 已复制到剪贴板`);
    toastRef.value.show(
      `已复制 ${type === 'KEY1' ? 'KEY 1' : 'KEY 2'} 到剪贴板`
    );
  } catch (err) {
    console.error('复制失败:', err);
  }
};

// --- 2. 修改验证函数 (静默失败 + 状态变更) ---
const sendMail = (row) => {
  const input = String(row.inputAttempt).trim().toLowerCase();
  const target = String(row.password || '')
    .trim()
    .toLowerCase();

  if (input === target) {
    // 密码正确：解锁、修改状态
    row.isUnlocked = true;
    row.status = '已发送';
    row.inputAttempt = '';

    // ✅ 核心魔法：记录在 window 对象中（防止切换模块后状态丢失）
    window.isEmailSent = true;
    // ✅ 发射全局事件通知其他模块
    window.dispatchEvent(new CustomEvent('email-sent'));

    // --- ✅ 新增：永久化存储逻辑 ---
    const storageKey = 'UNLOCKED_LIST';
    const itemIdentifier = `ModuleMail_${row.title}`.trim().toLowerCase();

    // 读取、添加、回写
    const unlockedList = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!unlockedList.includes(itemIdentifier)) {
      unlockedList.push(itemIdentifier);
      localStorage.setItem(storageKey, JSON.stringify(unlockedList));
    }
  }
  // 密码错误：静默失败，什么都不做
};

// ... 弹窗控制变量 ...
const activeDocs = ref([]); // 存储当前打开的所有文档对象

// 2. ✅ 修改打开附件的逻辑
const openAttachment = (fileName) => {
  // 查找文档数据
  const targetDoc = documentData.find((doc) => doc.file_name === fileName);
  const content = targetDoc
    ? targetDoc.content
    : `<p style="color: var(--red-alert); font-weight: bold;">ERROR: 文件内容已损坏</p>`;

  // 检查是否已经打开了同名文档（可选：如果你想允许重复打开，可以去掉这个判断）
  if (activeDocs.value.some((d) => d.title === fileName)) {
    // 如果已存在，可以考虑置顶它，或者直接返回
    return;
  }

  // 向数组中添加新文档实例
  activeDocs.value.push({
    id: Date.now() + Math.random(), // 确保 ID 唯一
    title: fileName,
    content: content,
  });
};

// 3. ✅ 新增关闭文档逻辑
const closeDocument = (id) => {
  activeDocs.value = activeDocs.value.filter((doc) => doc.id !== id);
};
</script>

<style scoped>
/* --- 这里只放表格和搜索框的样式 --- */
/* 只要不加 scoped，父组件定义的 :root 变量（比如 --primary）这里依然能用 */
.module-mail {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 核心：彻底关掉浏览器最外层的滚动条 */
}

/* 仅保留特有的输入框宽度控制 */
.input {
  width: 240px;
}
.input:focus {
  width: 250px;
}

/* 仅保留工具组靠右排列特性 */
.tool-group {
  display: flex;
  gap: 10px;
  margin-left: auto;
  align-items: center;
}

.detail-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.hint-header {
  opacity: 0.2 !important;
  font-size: var(--text-hidden);
}

.hidden-hint-cell {
  width: 150px;
  cursor: help;
}

.secret-text {
  opacity: 0;
  color: var(--red-alert);
  transition: opacity 0.5s;
}

.hidden-hint-cell:hover .secret-text {
  opacity: 1;
}

.no-data {
  text-align: center;
  padding: 50px;
  opacity: 0.5;
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

/* 2. 邮件正文区域 */
.mail-content {
  width: 100%;
  line-height: 1.5;
  text-align: left;
  /* ✅ 关键修改 1：保留 JSON 中的 \n 换行符 */
  white-space: pre-wrap;
  /* ✅ 关键修改 2：强制长单词（如URL、乱码）断行，防止撑开容器 */
  word-break: break-all;
  overflow-wrap: break-word;
}

/* 3. 附件区域 (带分割线) */
.mail-attachment {
  width: 100%;
  /* 这就是你要的分割线：一条细细的赛博绿虚线 */
  border-top: 1px dashed var(--bg-mask);
  padding-top: 15px;
  margin-top: 5px;
  text-align: left;
}

/* 4. 附件标题 (>> 附件：) */
.attachment-label {
  color: var(--primary);
  font-size: var(--btn-font-size);
  margin-bottom: 5px;
  opacity: 0.8;
}

/* 5. 附件具体文件名的样式 */
.attachment-item {
  display: inline-block;
  background: var(--bg-panel); /* 淡淡的背景 */
  border: var(--border-base); /* 细边框 */
  padding: 5px 10px;
  font-size: var(--btn-font-size);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

/* 鼠标移上去发光 */
.attachment-item:hover {
  background: var(--bg-mask);
  border-color: var(--primary);
  box-shadow: 0 0 5px var(--bg-mask);
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
  letter-spacing: 2px;
  transition: opacity 0.8s ease-in-out; /* 缓慢浮现 */
}

/* 鼠标悬停在区域上时，文字浮现 */
.hidden-msg-area:hover .hidden-msg-text {
  opacity: 1;
}

/* --- 新增：解锁面板样式 (嵌入在你的 expand-content 里) --- */
.unlock-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}

.unlock-input-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 让按钮靠右 */
  gap: 5px;
}

.inline-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: var(--border-base); /* 只有一条底线 */
  color: #fff;
  font-size: var(--text-base);
  padding: 5px 0;
  outline: none;
}
</style>
