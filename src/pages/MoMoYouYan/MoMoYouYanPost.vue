<template>
  <SystemPageTemplate system-class="MoMoYouYan">
    <div class="main-container MoMoYouYan">
      <div class="main-area">
        <div class="post-header">
          <div class="logo" title="网络科技与安全研究院">MoMo有言</div>
          <div class="title-section">
            <h1 class="main-title">{{ postData?.title }}</h1>
            <div class="user-actions">
              <span class="user-greeting">
                {{ currentUser ? currentUser.nickname : '未登录' }}
              </span>
              <button class="tool-btn" @click="handleComment">发表评论</button>
              <span class="header-datetime">2073-09-27 09:30</span>
            </div>
          </div>
        </div>

        <div v-if="isEmptyPost" class="empty-post-wrapper">
          <div class="empty-post-text">
            <p>身体作灵魂的语种</p>
            <p>--喻言《对方正在跳舞中》</p>
          </div>
        </div>

        <div v-else class="comments-list">
          <div
            v-for="comment in organizedComments"
            :key="comment.post_id"
            class="comment-block"
          >
            <div class="comment-main">
              <div class="comment-meta tool-group">
                <span class="comment-poster">
                  {{ comment.poster || '匿名用户' }}
                </span>
                <span v-if="comment.poster === originalPoster" class="lz-tag">
                  楼主
                </span>
                <span class="comment-time">{{ comment.reply_time }}</span>
              </div>

              <div class="comment-content">
                <span class="content-text">{{ comment.content }}</span>
                <div
                  v-if="comment.images && comment.images.length > 0"
                  class="image-list"
                >
                  <img
                    v-for="(img, index) in comment.images"
                    :key="index"
                    :src="img"
                    class="comment-image"
                  />
                </div>
                <div v-if="comment.links?.length" class="link-list">
                  <a
                    v-for="(link, index) in comment.links"
                    :key="index"
                    :href="link?.link_url || '#'"
                    target="_blank"
                    class="comment-link"
                  >
                    {{ link?.link_title || link?.link_url }}
                  </a>
                </div>
              </div>

              <span class="reply-trigger" @click="handleComment">回复</span>
            </div>

            <div v-if="comment.replies?.length > 0" class="sub-replies">
              <div
                v-for="sub in comment.replies"
                :key="sub.post_id"
                class="sub-reply-item"
              >
                <div class="sub-reply-main">
                  <span class="sub-poster">{{ sub.poster || '匿名用户' }}</span>
                  <span
                    v-if="sub.poster === originalPoster"
                    class="lz-tag"
                    style="zoom: 0.8; margin-left: 4px"
                  >
                    楼主
                  </span>
                  <span v-if="sub.isReplyToSub" class="reply-target-text">
                    回复
                    <span class="sub-poster">
                      {{ sub.replyTargetName || '匿名用户' }}
                    </span>
                  </span>
                  : <span class="sub-content">{{ sub.content }}</span>

                  <div
                    v-if="sub.images && sub.images.length > 0"
                    class="image-list"
                  >
                    <img
                      v-for="(img, index) in sub.images"
                      :key="index"
                      :src="img"
                      class="sub-image"
                    />
                  </div>

                  <div v-if="sub.links?.length" class="link-list">
                    <a
                      v-for="(link, index) in sub.links"
                      :key="index"
                      :href="link?.link_url || '#'"
                      target="_blank"
                      class="comment-link"
                    >
                      {{ link?.link_title || link?.link_url }}
                    </a>
                  </div>
                </div>

                <div class="sub-reply-footer">
                  <span class="sub-time">{{ sub.reply_time }}</span>
                  <span class="reply-trigger" @click="handleComment">回复</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Toast ref="toastRef" class="MoMoYouYan" />
      </div>
    </div>
  </SystemPageTemplate>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SystemPageTemplate from '../templates/SystemPageTemplate.vue';
import Toast from '../../components/common/BaseToast.vue';
import rawData from '../../data/MoMoYouYan/postData.json'; // 引入上面保存的JSON

const route = useRoute();
const postId = route.params.id;
const currentUser = ref(null);
const toastRef = ref(null);

// 初始化时获取用户信息
onMounted(() => {
  updateUserStatus();
});

// 2. 封装一个更新状态的方法
const updateUserStatus = () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser);
  } else {
    currentUser.value = null; // 确保没登录时是 null
  }
};

// 3. 核心：监听跨标签页的 Storage 变化
// 当你在主页登录/退出时，详情页能立刻发现并同步
window.addEventListener('storage', (e) => {
  if (e.key === 'user') {
    updateUserStatus();
  }
});

// 修改点击事件逻辑
const handleComment = () => {
  if (currentUser.value) {
    // 已登录状态
    toastRef.value?.show('还是别说话了 先搞清楚是怎么回事吧');
  } else {
    // 未登录状态
    toastRef.value?.show('发表评论前请先登录');
  }
};

// 根据路由传参 ID 查找对应的帖子数据
// 接收路由传过来的 id (其实就是 url)
const props = defineProps(['id']);

// 1. 统一从 query.path 获取（例如 URL 变为 ?path=20450312/hu2/0.html）
const targetPath = computed(() => route.query.path);

// 2. 使用 targetPath 进行查找
const postData = computed(() => {
  if (!targetPath.value) return null;
  // 确保 JSON 中的 url 字段与传过来的 path 字符串完全匹配
  return rawData.find((p) => p.url === targetPath.value) || null;
});

const isEmptyPost = computed(() => {
  return (
    !!postData.value &&
    Array.isArray(postData.value.posts) &&
    postData.value.posts.length === 0
  );
});

// 动态修改页面标题
watchEffect(() => {
  if (isEmptyPost.value) {
    document.title = '对方正在加载没来得及做的论坛数据中... - MoMo有言';
  } else if (postData.value?.title) {
    document.title = `${postData.value.title} - MoMo有言`;
  } else {
    document.title = '对方正在在加载中... - MoMo有言';
  }
});

// 2. 处理发言数据时，先判断 posts 是否存在
const organizedComments = computed(() => {
  if (
    !postData.value ||
    !Array.isArray(postData.value.posts) ||
    postData.value.posts.length === 0
  ) {
    return [];
  }

  const allPosts = postData.value.posts
    .filter((p) => p && typeof p === 'object' && p.post_id !== undefined)
    .map((p) => ({ ...p }));

  allPosts.sort((a, b) => new Date(a.reply_time) - new Date(b.reply_time));

  const rootComments = allPosts.filter(
    (p) => p.post_id === '0' || !p.reply_to_id || p.reply_to_id === '0'
  );

  const subPosts = allPosts.filter(
    (p) => p.post_id !== '0' && p.reply_to_id && p.reply_to_id !== '0'
  );

  return rootComments.map((root) => {
    const replies = subPosts
      .filter((sub) => {
        let parent = allPosts.find((p) => p.post_id === sub.reply_to_id);

        while (parent) {
          if (parent.post_id === root.post_id) return true;
          if (!parent.reply_to_id || parent.reply_to_id === '0') break;
          parent = allPosts.find((p) => p.post_id === parent.reply_to_id);
        }

        return false;
      })
      .map((sub) => {
        const replyTarget = allPosts.find((p) => p.post_id === sub.reply_to_id);

        return {
          ...sub,
          replyTargetName: replyTarget?.poster || '',
          isReplyToSub: !!replyTarget && replyTarget.post_id !== root.post_id,
        };
      })
      .filter((sub) => sub && sub.post_id !== undefined);

    return {
      ...root,
      replies,
    };
  });
});

// 获取原帖楼主的昵称
const originalPoster = computed(() => {
  // 楼主通常是 posts 数组中的第一项，或者 post_id 为 '0' 的项
  const root = postData.value?.posts?.find((p) => p.post_id === '0');
  return root ? root.poster : null;
});
</script>

<style>


/* 基础布局 */
.main-container {
  height: 100%;
  width: 100%; /* 🎯 核心修改：强制撑满浏览器宽度 */
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
  position: relative;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 解决 flex 子元素高度溢出的黑科技 */
}

/* 页眉 */
.post-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: var(--border);
}

.logo {
  font-size: var(--text-logo);
  align-self: center;
  font-weight: bold;
  color: var(--title);
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.main-title {
  color: var(--title);
  font-size: 1.5rem;
  margin: 0;
  flex: 1;
  border-right: var(--border);
}

/* 用户状态 */
.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.user-greeting {
  font-size: var(--text-base);
  color: var(--primary);
  white-space: nowrap;
  margin-right: 20px;
  padding-right: 20px;
  border-right: var(--border);
}

.header-datetime {
  margin-left: 20px;
  padding-left: 20px;
  border-left: var(--border);
  font-size: var(--text-base);
  color: var(--title);
  white-space: nowrap;
}

/* 评论列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-bottom: 20px;
}

.comment-block {
  background-color: var(--bord-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  width: 95%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 主楼 */
.comment-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comment-meta {
  font-size: var(--text-base);
  color: #000;
  border-bottom: 1px dashed var(--primary);
  padding-bottom: 5px;
  display: flex;
  gap: 5px;
}

.comment-poster {
  font-weight: bold;
  color: var(--title);
}

.lz-tag {
  background-color: var(--accent);
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: var(--text-tag);
}

.comment-content {
  color: var(--content);
  font-size: var(--text-base);
  line-height: 1.5;
  white-space: pre-wrap;
  text-align: left;
}

/* 楼中楼 (子回复) */
.sub-replies {
  border-radius: 4px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-top: 1px dashed var(--primary);
}

.sub-reply-item {
  display: flex;
  flex-direction: column;
  padding-top: 10px;
}

.sub-reply-main {
  width: 100%;
  font-size: var(--text-base);
  color: var(--content);
  line-height: 1.5;
  text-align: left;
}

.sub-poster {
  color: var(--title);
  font-weight: bold;
}

/* 🎯 关键修改：子回复底部工具栏 */
.sub-reply-footer {
  display: flex;
  justify-content: flex-end; /* 强制内容靠右 */
  align-items: center;
  padding: 5px 0;
  margin-bottom: 5px;
  border-bottom: 1px dashed var(--primary); /* 虚线分割线 */
}

/* 最后一条子回复去掉虚线 */
.sub-reply-item:last-child .sub-reply-footer {
  border-bottom: none;
}

.sub-time {
  color: #666;
  font-size: var(--text-tag);
  padding-right: 10px;
  border-right: 1px solid var(--primary); /* 时间和回复之间的分割竖线 */
  line-height: 1;
}

.reply-trigger {
  font-size: var(--text-tag);
  color: #000;
  cursor: pointer;
  padding-left: 10px;
  line-height: 1;
  transition: color 0.2s;
  align-self: flex-end;
}

.reply-trigger:hover {
  color: var(--primary);
  text-decoration: underline;
}

/* 页脚 */
.footer {
  margin-top: auto; /* 在 flex 布局中自动推至最底 */
}

/* 2. 核心修改：消除页脚段落默认间距，压缩行高 */
.footer p {
  margin: 1px 0; /* 🎯 极致压缩段落上下的外边距 */
  line-height: 1; /* 🎯 减小行间距 */
}

.empty-post-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 80px;
}

.empty-post-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 720px;
  width: 100%;
  min-height: 42vh;
  text-align: center;
  color: var(--title);
  letter-spacing: 0.08em;
}

.empty-post-text p {
  margin: 0;
}

.empty-post-text p:first-child {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.7;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.empty-post-text p:last-child {
  margin-top: 1.8rem;
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
  line-height: 1.8;
  align-self: flex-end;
}
</style>
