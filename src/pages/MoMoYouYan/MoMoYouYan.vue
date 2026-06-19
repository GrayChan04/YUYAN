<template>
  <SystemPageTemplate system-class="MoMoYouYan">
    <Begin :visible="showIntro" />

    <div class="main-container MoMoYouYan">
      <div class="main-area">
        <header class="forum-header">
          <div class="logo" title="网络科技与安全研究院">MoMo有言</div>
          <div class="user-actions">
            <template v-if="!isLoggedIn">
              <button class="tool-btn" @click="login">登录</button>
            </template>
            <template v-else>
              <span class="user-greeting">{{ currentUser }}</span>
              <button class="tool-btn" @click="toPrivateSpace">
                {{ isPrivateSpace ? '返回全部' : '个人空间' }}
              </button>
              <button class="tool-btn" @click="createPost">发帖</button>
              <button class="tool-btn" @click="logout">退出登录</button>
            </template>
            <span class="header-datetime">2073-09-27 09:30</span>
          </div>
        </header>

        <section class="notice-board">
          <h2>【置顶公告】</h2>
          <p>
            1. 本论坛为<a href="#" class="institute-link">研究院</a
            >内部匿名交流平台，仅限工作之余情绪调剂。用户需严格遵守本单位工作保密条例，<strong
              >严禁讨论任何公务、项目的技术细节或涉密信息。</strong
            >
          </p>
          <p>
            2.
            严禁以任何形式窃取、爬取或尝试获取其他用户的任何信息。违者将承担全部责任。
          </p>
          <p>
            3.
            本论坛已接入本单位员工认证系统，请在内网环境下使用个人工号登录。未登录用户仅可浏览帖文，无发帖、评论权限。
          </p>
          <p>
            4.
            为保持信息时效性，仅展示当日发布的帖文。如需查阅历史内容，请使用搜索功能进行检索或进通过个人空间查看。
          </p>
        </section>

        <nav class="category-nav">
          <div class="nav-wrapper">
            <div class="search-bar tool-group">
              <input
                type="text"
                v-model="inputKeyword"
                class="input"
                placeholder="输入日期、标题或发帖人昵称搜索"
                @keyup.enter="handleSearch"
              />
              <button class="tool-btn" @click="handleSearch">搜索</button>
            </div>

            <div class="category-section">
              <div v-if="isPrivateSpace" class="private-mode-wrapper">
                <button class="private-mode-btn" @click="togglePrivateMode">
                  {{ privateMode === 'created' ? '我发起的' : '我参与的' }}
                </button>

                <div class="private-divider"></div>
              </div>

              <ul class="category-list">
                <li
                  v-for="cat in categories"
                  :key="cat"
                  :class="{ active: currentCategory === cat }"
                  @click="currentCategory = cat"
                >
                  {{ cat }}
                </li>
              </ul>
            </div>
          </div>
          <div class="nav-divider"></div>
        </nav>

        <div class="post-list">
          <div v-if="filteredPosts.length === 0" class="empty-state">
            没有找到相关的帖子...
          </div>
          <ul v-else>
            <li
              v-for="post in filteredPosts"
              :key="post.url"
              class="post-item"
              :class="{ 'status-deleted': post.status === '已删除' }"
            >
              <div class="post-left">
                <template v-if="post.status === '已删除'">
                  <span class="post-title-disabled"
                    >{{ post.title }} (已删除)</span
                  >
                </template>
                <template v-else>
                  <router-link
                    v-if="post.status !== 'secret'"
                    :to="{ name: 'MoMoYouYanPost', query: { path: post.url } }"
                    target="_blank"
                    class="post-title"
                  >
                    {{ post.title }}
                  </router-link>
                  <router-link
                    v-else
                    :to="{ name: 'HÖÐR' }"
                    target="_blank"
                    class="post-title"
                  >
                    {{ post.title }}
                  </router-link>
                </template>
                <span
                  class="post-category-tag"
                  @click="currentCategory = post.category"
                >
                  {{ post.category }}
                </span>
              </div>
              <div class="post-right">
                <span class="poster">{{ post.posts?.[0]?.poster }}</span>
                <span class="post-time">{{ formatFullTime(post.time) }}</span>
              </div>
            </li>
          </ul>
        </div>
        <Popup
          v-model:visible="showLoginPopup"
          class="MoMoYouYan"
          title="内网统一认证登录"
          mode="login"
          hint="个人工号："
          :user-list="personnelDataRaw"
          @success="onLoginSuccess"
        />
        <Toast ref="toastRef" class="MoMoYouYan" />
      </div>
    </div>
  </SystemPageTemplate>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SystemPageTemplate from '../templates/SystemPageTemplate.vue'; // 👈 新增：用于跳转页面
import Begin from '../../components/animations/Begin.vue';
import Toast from '../../components/common/BaseToast.vue';
import Popup from '../../components/common/BasePopup.vue'; // 导入弹窗组件

import postDataRaw from '../../data/MoMoYouYan/postData.json';
import personnelDataRaw from '../../data/HÖÐR/personnelData.json';
import HÖÐRLoginData from '../../data/HÖÐR/HÖÐRLoginData.json';

const showIntro = ref(false);

const router = useRouter(); // 👈 新增
const route = useRoute();

const postsData = ref(postDataRaw);
const isPrivateSpace = ref(false); // 是否处于个人空间模式
const isTimeLockEnabled = ref(false);

const privateMode = ref('created');
// created = 我发起的
// participated = 我参与的

const inputKeyword = ref('');
// 2. 新增：真正用于过滤列表的“生效”变量
const searchKeyword = ref('');
const currentCategory = ref('全部');
const categories = [
  '全部',
  '八卦闲聊',
  '不吐不快',
  '技术交流',
  '万事求助',
  '寻人寻物',
];

// 模拟登录信息（确保 currentUser.value 能匹配 personnelDataRaw 中的 nick_name）
const isLoggedIn = ref(false);
const showLoginPopup = ref(false); // 控制登录弹窗显示
const currentUser = ref(''); // 对应 personnelDataRaw 中的 nick_name

const checkBegin = () => {
  const hasPlayed = localStorage.getItem('prophecy_intro_played');

  if (hasPlayed) {
    return;
  }

  showIntro.value = true;

  localStorage.setItem('prophecy_intro_played', 'true');

  setTimeout(() => {
    showIntro.value = false;
  }, 2500);
};

//锁帖
const LOCK_TIME = '20730927 09:30:00';
const isLockedPost = (p) => {
  if (!isTimeLockEnabled.value) return false;
  if (!p.time) return false;

  return String(p.time).trim() > LOCK_TIME;
};

// 核心计算属性：过滤帖子
const filteredPosts = computed(() => {
  // --- 1. 个人空间模式 (Private Space) ---
  if (isPrivateSpace.value) {
    const myName = currentUser.value;

    return postsData.value
      .filter((p) => {
        // 🚫 时间锁：直接屏蔽未来内容（不可见 + 不可搜）
        if (isLockedPost(p)) return false;

        const isAuthor = p.posts?.[0]?.poster === myName;

        const isParticipant = p.posts?.some(
          (comment) => comment.poster === myName
        );

        if (privateMode.value === 'created') {
          return isAuthor;
        }

        return isParticipant;
      })
      .filter((p) => {
        if (currentCategory.value !== '全部') {
          return p.category === currentCategory.value;
        }

        return true;
      })
      .slice()
      .sort((a, b) => b.time.localeCompare(a.time));
  }

  // --- 2. 论坛首页模式 (Home Page) ---
  const q = searchKeyword.value.trim().toLowerCase();

  return postsData.value
    .filter((p) => {
      // 🚫 时间锁：直接屏蔽未来内容（不可见 + 不可搜）
      if (isLockedPost(p)) return false;

      // 基础过滤：首页不显示“已删除”
      if (p.status === '已删除') return false;

      // A. 如果没有搜索关键词：只显示特定日期的帖子
      if (!q) {
        return p.time.includes('20730927') && p.status === '正常';
      }

      // ✅ 安全访问：使用 ?. 确保 p.posts[0] 存在
      const posterName = p.posts?.[0]?.poster?.toLowerCase() || '';
      const postTitle = p.title?.toLowerCase() || '';
      const postTime = p.time?.toLowerCase() || '';

      const matchKeyword =
        postTime.includes(q) || postTitle.includes(q) || posterName.includes(q);

      return p.status !== '已删除' && matchKeyword;
    })
    .filter((p) => {
      // 额外的分类过滤
      if (currentCategory.value !== '全部') {
        return p.category === currentCategory.value;
      }
      return true;
    })
    .slice()
    .sort((a, b) => b.time.localeCompare(a.time));
});

// 切换模式函数
const toPrivateSpace = () => {
  isPrivateSpace.value = !isPrivateSpace.value;

  // 每次进入个人空间默认显示“我发起的”
  if (isPrivateSpace.value) {
    privateMode.value = 'created';
  }
};
// 切换个人空间帖子显示模式
const togglePrivateMode = () => {
  privateMode.value =
    privateMode.value === 'created' ? 'participated' : 'created';
};

// 4. 实现手动触发函数
const handleSearch = () => {
  searchKeyword.value = inputKeyword.value; // 将输入框的内容同步给过滤变量
};

const login = () => {
  showLoginPopup.value = true;
};

const restoreLoginStatus = () => {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) return;

  const user = JSON.parse(savedUser);

  isLoggedIn.value = true;
  currentUser.value = user.nickname;
};

const onLoginSuccess = (user) => {
  isLoggedIn.value = true;
  currentUser.value = user.nick_name; // 这里的 user 是 personnelDataRaw 中的一项

  // 🎯 核心新增：将用户信息存入 localStorage
  // 确保存入的对象结构与详情页读取的结构一致
  const userToSave = {
    nickname: user.nick_name,
    work_id: user.work_id,
  };
  localStorage.setItem('user', JSON.stringify(userToSave));
};

// 退出登录也需要清空存储
const logout = () => {
  isLoggedIn.value = false;
  currentUser.value = '';
  localStorage.removeItem('user'); // 🎯 新增：清除存储
};

// 1. 定义引用
const toastRef = ref(null);
// 2. 修改原本的发帖函数
const createPost = () => {
  // 调用 toast 组件暴露出来的 show 方法
  toastRef.value?.show('还是别说话了 先搞清楚是怎么回事吧');
};

const formatFullTime = (timeStr) => timeStr;

onMounted(() => {
  restoreLoginStatus();
  isTimeLockEnabled.value = true;

  checkBegin();

  // 如果当前路径不是以 .html 结尾（比如是通过 /hodr 进来的）
  // 且当前路由名是 HÖÐR
  if (route.path !== '/HÖÐR' && route.name === 'HÖÐR') {
    // 使用 replace 替换当前历史记录，用户无感知地修正 URL
    router.replace({ path: '/HÖÐR' });
  }
});
</script>

<style>
.main-container {
  height: 100%;
  width: 100%; /* 🎯 核心修改：强制撑满浏览器宽度 */
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
  position: relative;
}

/* 主区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: var(--border);
  margin-bottom: 20px;
}

.logo {
  font-size: var(--text-logo);
  font-weight: bold;
  color: var(--title);
  letter-spacing: 2px;
}

/* 1. 用户操作区的整体布局 */
.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 确保内容整体靠右对齐 */
  gap: 10px; /* 这个是文字和按钮之间的默认基础间距 */
}

.header-datetime {
  margin-left: 20px; /* 与左侧按钮拉开明显距离 */
  padding-left: 20px;
  border-left: var(--border); /* 加一条竖线作为视觉分割 */
  font-size: var(--text-base);
  color: var(--title); /* 墨绿色的半透明状态，不抢戏 */
  white-space: nowrap; /* 防止屏幕窄时时间换行 */
}

/* 2. 限制欢迎文字的样式 */
.user-greeting {
  font-size: var(--text-base);
  color: var(--primary);
  white-space: nowrap;
  margin-right: 20px; /* 额外增加文字与“个人空间”按钮之间的距离 */
  padding-right: 20px;
  border-right: var(--border); /* 加一条竖线作为视觉分割 */
}

.notice-board {
  background-color: var(--bord-bg);
  padding: 5px 20px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 5px solid var(--accent);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.notice-board h2 {
  margin-top: 0; /* 去掉标题顶部多余空间 */
  margin-bottom: 10px; /* 标题和正文留一点点距离即可 */
}

.notice-board p {
  margin: 5px 0; /* 核心修改：将上下边距从默认的 16px 压缩到 5px */
  line-height: 1.5; /* 适当的行高让多行文字不拥挤 */
  font-size: var(--text-title);
  color: var(--text-primary);
}
.nav-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 改回居中对齐，最稳妥 */
  width: 100%;
  gap: 20px;
  height: 40px; /* 强制整个行的高度固定 */
  margin-bottom: 5px; /* 给底线留出微小空隙，防止重叠 */
}

.search-bar,
.category-list {
  display: flex;
  align-items: center;
  height: 30px; /* 必须与 nav-wrapper 一致 */
  margin: 0;
  padding: 0;
}

.category-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-list li {
  height: 30px;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整分类选项列表 */
.category-nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 10px;
}

/* 墨绿色分隔线 */
.nav-divider {
  height: 1px;
  background-color: var(--primary);
  width: 100%;
  margin-top: 0;
  margin-bottom: 0px;
  opacity: 0.8;
}
/* 移除原先 header 中 search-bar 的多余边距（如果有） */
.forum-header .search-bar {
  display: none; /* 确保 header 里旧的彻底消失 */
}

/* 关键修改：控制栏布局 */
.filter-control-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.input {
  padding: 5px 10px;
  border-radius: 4px;
  width: 250px;
}

.category-nav .category-list {
  display: flex;
  list-style: none;
  gap: 10px;
  margin: 0;
  padding: 10;
}

.category-nav li {
  padding: 5px 10px;
  background-color: transparent;
  border: var(--border-base);
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--text-btn);
  transition: all 0.2s;
  white-space: nowrap;
}

.category-nav li.active {
  background-color: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* 3. 核心修改：让列表容器承接滚动 */
.post-list {
  flex: 1; /* 自动占据剩余的所有高度 */
  overflow-y: auto; /* 只有这里允许纵向滚动 */
  min-height: 0; /* 🎯 极其重要：这是 Flex 布局中防止内容撑开父容器的黑科技 */
  padding-right: 10px; /* 给右侧滚动条留一点呼吸空间 */
  margin-top: 5px;
  padding-bottom: 10px;
}

.post-item {
  display: flex; /* 开启弹性布局 */
  justify-content: space-between; /* 关键：左右两端对齐 */
  align-items: center; /* 垂直居中对齐 */
  padding: 15px 0;
  border-bottom: 1px dashed var(--accent); /* 你的分隔线 */
  width: 100%; /* 确保占满全宽 */
}
/* 删除状态的整行样式 */
.post-item.status-deleted {
  opacity: 0.5; /* 变淡变灰 */
  pointer-events: none; /* 彻底禁止点击事件 */
  background-color: rgba(0, 0, 0, 0.02);
}

.post-left {
  display: flex;
  flex-direction: column; /* 强制垂直排列：标题在上，标签在下 */
  align-items: flex-start; /* 确保所有子元素（标题和标签）都靠左对齐 */
  gap: 5px; /* 标题与标签之间的间距 */
  flex: 1; /* 占据剩余空间 */
}

.post-title:link {
  color: var(--primary);
  text-decoration: none;
  display: block;
  font-weight: bold;
  font-size: var(--text-title);
  line-height: 1.5;
  margin: 0;
  text-align: left;
}

.post-title:visited {
  color: var(--visited);
}

.post-title:hover {
  text-decoration: underline;
}

/* 标题化线效果 */
.post-title-disabled {
  text-decoration: line-through; /* 关键：删除线 */
  font-weight: bold;
  font-size: var(--text-title);
  cursor: not-allowed;
}

.post-category-tag {
  font-size: var(--text-tag);
  background-color: var(--bord-bg);
  color: var(--primary);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  /* 确保它不会撑满整行，保持自身宽度 */
  width: fit-content;
  transition: opacity 0.2s;
}

.post-category-tag:hover {
  opacity: 0.8;
}

.post-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: var(--text-base);
  color: #000;
}

.private-mode-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.private-mode-btn {
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;

  font-size: var(--text-btn);
  background-color: var(--primary);
  color: #fff;
  border-color: var(--primary);
  border: var(--border-base);
}

.private-mode-btn:hover {
  opacity: 0.8;
}

.private-divider {
  width: 1px;
  height: 30px;
  background: var(--primary);
  opacity: 0.5;
}

.footer {
  margin-top: auto; /* 在 flex 布局中自动推至最底 */
}

/* 2. 核心修改：消除页脚段落默认间距，压缩行高 */
.footer p {
  margin: 1px 0; /* 🎯 极致压缩段落上下的外边距 */
  line-height: 1; /* 🎯 减小行间距 */
}
</style>
