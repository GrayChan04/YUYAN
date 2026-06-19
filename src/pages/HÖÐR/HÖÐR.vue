<template>
  <SystemPageTemplate system-class="HÖÐR">
    <Popup
      v-model:visible="showHÖÐRLogin"
      class="HÖÐR"
      title="访问认证"
      mode="login"
      hint="用户名："
      :persistent="true"
      :user-list="HÖÐRAccountData"
      @success="onHÖÐRLoginSuccess;"
    />
    <!-- 登录动画 -->
    <HÖÐRLogin v-if="isLoading" @finished="onAnimationFinished" class="HÖÐR" />
    <!-- 主容器 -->
    <div v-if="isAuthenticated && isAnimationDone" class="main-container HÖÐR">
      <!-- 主要内容区域 -->
      <div class="main-area">
        <!-- 左边功能栏 -->
        <aside class="sidebar" @click="currentModule = ''">
          <!-- 最顶端：系统名称 -->
          <div class="sidebar-header">H Ö Ð R</div>
          <!-- 中间：功能选项卡 -->
          <nav class="sidebar-menu">
            <ul>
              <!-- 
               @click.stop.prevent: 
               1. .stop 阻止冒泡，防止触发外层 sidebar 的重置事件 
               2. .prevent 阻止 a 标签默认跳转
               3. 赋值 currentModule 对应的名称
               
               :class: 判断当前 module 是否等于该项，是则添加 active 类
            -->
              <li>
                <a
                  href="#"
                  @click.stop.prevent="currentModule = 'infrastructure'"
                  :class="{ active: currentModule === 'infrastructure' }"
                >
                  设施控制
                </a>
              </li>
              <li>
                <a
                  href="#"
                  @click.stop.prevent="currentModule = 'personnel'"
                  :class="{ active: currentModule === 'personnel' }"
                >
                  人员监控
                </a>
              </li>
              <li>
                <a
                  href="#"
                  @click.stop.prevent="currentModule = 'mail'"
                  :class="{ active: currentModule === 'mail' }"
                >
                  邮件管理
                </a>
              </li>
              <li>
                <a
                  href="#"
                  @click.stop.prevent="currentModule = 'program'"
                  :class="{ active: currentModule === 'program' }"
                >
                  程序执行
                </a>
              </li>
              <li>
                <a
                  href="#"
                  @click.stop.prevent="currentModule = 'operation'"
                  :class="{ active: currentModule === 'operation' }"
                >
                  操作日志
                </a>
              </li>
            </ul>
          </nav>
          <!-- 最底端：系统状态 -->
          <div class="sidebar-status">
            <span class="status-dot"></span>
            <p>系统状态：稳定运行</p>
          </div>
        </aside>

        <!-- 右侧主要内容区 -->
        <section class="main-panel">
          <!-- 顶端：操作者和日期 -->
          <header class="top-bar">
            <div class="user-info">
              操作者：<span class="user-name">陈墨</span>
            </div>
            <div class="date-info">
              <span id="datetime">{{ currentTime }}</span>
            </div>
          </header>

          <!-- 下面：具体的功能内容展示区 -->
          <main class="content-area">
            <!-- 水印 -->
            <div v-if="currentModule === ''" class="watermark">
              <span class="watermark_text">乞求别人施舍的安全</span>
              <span class="watermark_text">我宁愿选择危险</span>
            </div>
            <!-- 以后点击左边，这里的内容会发生变化 -->
            <!-- 设置控制 -->
            <ModuleInfrastructure
              v-show="currentModule === 'infrastructure'"
              class="content-section"
            />

            <!-- 人员监控 -->
            <ModulePersonnel
              v-show="currentModule === 'personnel'"
              class="content-section"
            />

            <!-- 邮件管理 -->
            <ModuleMail
              v-show="currentModule === 'mail'"
              class="content-section"
            />

            <!-- 程序执行 -->
            <ModuleProgram
              v-show="currentModule === 'program'"
              class="content-section"
            />

            <!-- 操作日志 -->
            <ModuleOperation
              v-show="currentModule === 'operation'"
              class="content-section"
            />
          </main>
        </section>
      </div>
      <!-- 页脚 -->
    </div>
    <div
      v-if="!isAuthenticated || isLoading"
      class="unauthorized-bg HÖÐR"
    ></div>
  </SystemPageTemplate>
</template>

<script setup>
// 引入变量
import { ref, onMounted, onUnmounted } from 'vue';
import SystemPageTemplate from '../templates/SystemPageTemplate.vue';
// 引入登录动画
import HÖÐRLoginData from '../../data/HÖÐR/HÖÐRLoginData.json';
import HÖÐRLogin from '../../components/animations/HÖÐRLogin.vue';
// 引入功能模块
import ModuleOperation from './modules/ModuleOperation.vue';
import ModuleProgram from './modules/ModuleProgram.vue';
import ModuleMail from './modules/ModuleMail.vue';
import ModulePersonnel from './modules/ModulePersonnel.vue';
import ModuleInfrastructure from './modules/ModuleInfrastructure.vue';
import Toast from '../../components/common/BaseToast.vue';
import Popup from '../../components/common/BasePopup.vue'; // 导入弹窗组件

// 1. 状态控制
const isLoading = ref(false); // 初始不播放动画
const showHÖÐRLogin = ref(false); // 初始显示登录弹窗
const isAuthenticated = ref(false); // 是否认证成功（控制主系统显示）
const isAnimationDone = ref(false); // 动画是否播放完成
const HÖÐRAccountData = ref(HÖÐRLoginData);

// 2. 登录成功的回调
const onHÖÐRLoginSuccess = (user) => {
  showHÖÐRLogin.value = false; // 1. 关闭登录窗
  isLoading.value = true; // 2. 开始播放启动动画

  // 此时暂不设置 isAuthenticated，等动画播完再进系统
  sessionStorage.setItem('HÖÐR_auth', 'true');
};

// 🎯 核心逻辑：动画播放完成后的处理
const onAnimationFinished = () => {
  isLoading.value = false; // 1. 隐藏动画组件
  isAnimationDone.value = true; // 2. 标记动画完成
  isAuthenticated.value = true; // 3. 正式渲染主系统界面
};

// 定义当前激活的模块，默认为空字符串 ''，表示显示水印状态
const currentModule = ref('');

const currentTime = ref('2073-09-27 15:26');

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
  currentTime.value = '2073-09-27 15:26';
};
const handleWindExecuted = () => {
  isWindExecuted.value = true; // ✅ 新增：接收到信号后更新为 true
  currentTime.value = '2073-09-27 16:04';
};
const handlePersonnelExported = () => {
  isPersonnelExported.value = true;
  currentTime.value = '2073-09-27 17:25';
}; // ✅ 新增：更新状态

// 3. 挂载与销毁监听
onMounted(() => {
  // 强行把地址栏文字改为你想要的样式，而不触发页面刷新或路由匹配
  window.history.replaceState(null, '', '/HÖÐR');
  // 检查是否已经认证过
  const authStatus = sessionStorage.getItem('HÖÐR_auth');

  if (authStatus === 'true') {
    // 如果已经登录过了，直接进系统，不需要再看动画和登录框
    isAuthenticated.value = true;
    isAnimationDone.value = true;
    window.addEventListener('email-sent', handleEmailSent);
    window.addEventListener('wind-executed', handleWindExecuted); // ✅ 新增监听
    window.addEventListener('personnel-exported', handlePersonnelExported); // ✅ 新增：监听
  } else {
    // 没登录，直接弹出登录框
    showHÖÐRLogin.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('email-sent', handleEmailSent);
  window.removeEventListener('wind-executed', handleWindExecuted); // ✅ 移除监听
  window.removeEventListener('personnel-exported', handlePersonnelExported); // ✅ 移除监听
});
</script>

<style scoped>
.unauthorized-bg {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--bg);
  z-index: 5; /* 确保在普通内容之上 */
}
/* 容器 */
.main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 15px; /* 留出外边距，更有悬浮感 */
  box-sizing: border-box; /* 🎯 极其重要：确保 padding 不会额外增加总高度 */
}

/* 主区域 */
.main-area {
  flex: 1;
  display: flex;
  gap: 15px; /* 侧边栏和内容区的间距 */
  overflow: hidden;
  flex-direction: row; /* 【明确指定】横向排列 sidebar 和 main-panel */
}

/* --- 左侧侧边栏 (Floating Panel) --- */
.sidebar {
  width: 250px;
  background: var(--bg-panel);
  border: var(--border);
  display: flex;
  flex-direction: column;
  padding: 30px 0;
  backdrop-filter: blur(5px); /* 背景模糊，增加高级感 */
  border-radius: 8px; /* 数值越大圆角越钝 */
  overflow: hidden; /* 必须加这句，否则内部背景色会盖住圆角 */
  padding-bottom: 0; /* 必须为0，否则状态栏会被父盒子的边距顶上来 */
}

.sidebar-header {
  font-size: 2.5rem;
  font-weight: 400;
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
  letter-spacing: 8px; /* 数值越大，字母间距越宽 */
  padding-left: 5px; /* 小技巧：左边补一个同样的间距，让文字视觉上依然保持居中 */
}

/* --- 1. 侧边栏菜单容器重置 (消除左侧空白的关键) --- */
.sidebar-menu ul {
  list-style: none;
  padding: 0; /* 🚫 彻底清除浏览器默认的 40px 左边距 */
  margin: 0;
  width: 100%;
}

/* --- 2. 菜单列表项 --- */
.sidebar-menu ul li {
  list-style: none; /* 双重保险消除圆点 */
  margin-bottom: 5px;
  width: 100%;
}

/* --- 3. 菜单链接 (基础状态) --- */
.sidebar-menu ul li a {
  color: var(--primary);
  text-decoration: none;
  display: block;
  /* padding-left 从 40px 改为 20px，让文字更贴左 */
  padding: 15px 40px;
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.7;
  letter-spacing: 4px;
}

/* --- 4. 背景滑块动画 (伪元素) --- */
.sidebar-menu ul li a::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%; /* 初始藏在左侧框外 */
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--bg-mask), transparent);
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

/* --- 5. 悬停与激活状态 (统一逻辑) --- */
.sidebar-menu ul li a:hover,
.sidebar-menu ul li a.active {
  opacity: 1;
  background: var(--bg-mask);
  /* 悬停时稍微右移，做出“推入”感，35px 比较精致 */
  padding-left: 50px;
  color: #ffffff;
}

/* 只有激活项显示左侧边框线 */
.sidebar-menu ul li a.active {
  border-left: var(--border-left);
}

/* 触发滑块滑入 */
.sidebar-menu ul li a:hover::before,
.sidebar-menu ul li a.active::before {
  opacity: 1;
  left: 0;
}

.sidebar-status {
  font-size: var(
    --text-status
  ); /* 调整为你觉得合适的大小，11px-12px 通常比较显高级 */
  opacity: 0.7; /* 让文字稍微黯淡一点，不抢眼 */
  letter-spacing: 2px; /* 也可以给它加一点微小的字间距，更具电子感 */
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 【必须添加】垂直居中：解决小灯在顶部的问题 */
  width: 100%; /* 确保占据整行，方便居中 */
  padding: 10px 0; /* 增加上下内边距，保持底部呼吸感 */
  margin-top: auto; /* 强制将其推向容器的最底部 */
  border-top: var(--border-one); /* 建议保留细微分割线，增加层次感 */
  gap: 5px; /* 小灯和文字之间的间距 */
}

.sidebar-status p {
  margin: 0;
  display: inline-block; /* 保证居中效果 */
}

.status-dot {
  display: block; /* 确保宽高生效 */
  width: 4px; /* 小灯的大小 */
  height: 4px;
  background-color: var(--primary); /* 使用你的亮绿色 */
  border-radius: 50%; /* 变成圆点 */
  /* 初始发光效果 */
  box-shadow: 0 0 8px var(--primary);
  /* 绑定动画：名字 持续时间 无限循环 匀速 */
  animation: status-blink 2s infinite;
}

/* 定义呼吸灯动画 */
@keyframes status-blink {
  0% {
    opacity: 0.3;
    box-shadow: 0 0 2px var(--primary);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 12px var(--primary); /* 最亮时扩散光影 */
  }
  100% {
    opacity: 0.3;
    box-shadow: 0 0 2px var(--primary);
  }
}

/* --- 右侧主要面板 --- */
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border: var(--border);
  backdrop-filter: blur(5px);
  border-radius: 8px; /* 数值越大圆角越钝 */
  overflow: hidden; /* 必须加这句，否则内部背景色会盖住圆角 */
}

.top-bar {
  height: 40px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: var(--border);
  font-size: var(--text-status);
  background: var(--bg-panel);
}

.user-info {
  color: var(--primary);
  letter-spacing: 8px; /* 也可以给它加一点微小的字间距，更具电子感 */
}

/* --- 内容展示区 --- */
.content-area {
  flex: 1;
  padding: 10px;
  position: relative;
  overflow-y: auto;
}

/* 功能内容区 */
.content-section {
  width: 100%;
  height: 100%;
  padding: 10px;
  /* 建议开启 Flex 布局，方便内容垂直排列 */
  display: flex;
  flex-direction: column;
  gap: 10px; /* 内部元素（标题、正文等）的间距 */
  /* 确保内容在水印上方 */
  position: relative;
  z-index: 1;
  animation: fadeIn 0.5s ease-out;
  font-size: var(--text-title);
}

/* 定义content-section淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- 水印 (两行，巨大) --- */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  text-align: center;
  display: flex;
  flex-direction: column; /* 让两行文字垂直排列 */
  gap: 50px; /* 【关键】这里控制两行之间的距离，数值越大间距越宽 */
}

.watermark_text {
  display: block;
  font-size: 4vw; /* 随着窗口大小缩放字体 */
  font-weight: 400;
  color: var(--watermark);
  opacity: 0.1; /* 非常淡，才有高级感 */
  line-height: 1;
  white-space: nowrap;
  letter-spacing: 20px; /* 推荐设置在 15px 到 30px 之间，更有呼吸感 */
  text-indent: 20px; /* 关键：设置和字间距一样的首行缩进，确保文字在视觉上依然完美居中 */
  text-shadow: 0 0 12px #d4fc79;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: var(--primary);
}
</style>
