<template>
  <!-- 设施控制 -->
  <div class="module-infrastructure HÖÐR">
    <div class="search-bar">
      <div class="tool-group left">
        <span class="search-label">>></span>
        <button
          v-for="b in ['M', 'A']"
          :key="b"
          :class="['tool-btn', { active: currentBuilding === b }]"
          @click="currentBuilding = b"
        >
          {{ b === 'M' ? 'M' : 'A' }}
        </button>
      </div>
      <div class="tool-group right">
        <span class="search-label">>></span>
        <button
          v-for="f in floorOptions"
          :key="f"
          :class="['tool-btn', { active: currentFloor === f }]"
          @click="currentFloor = f"
        >
          {{ f }}F
        </button>
      </div>
    </div>

    <div class="floor-plan-container">
      <img
        :src="floorPlanSrc"
        :alt="`Floor Plan ${currentBuilding}-${currentFloor}`"
        class="themed-map"
      />
    </div>

    <div class="control-panel">
      <div class="side-section public-power">
        <div class="public-header sticky-header">
          <span class="info-label section-title">公共区域设施控制</span>
        </div>
        <div class="params-container" v-if="currentConfig">
          <div
            v-for="(val, key) in publicPowerParams"
            :key="key"
            class="param-item"
          >
            <span class="param-name">{{ key }}</span>
            <div class="input-with-unit">
              <input
                :type="isEditing ? 'text' : 'button'"
                v-model="publicPowerParams[key]"
                :disabled="!isEditing"
                class="edit-input short-input"
              />
              <span class="unit-text">{{ unitMap[key] || '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="vertical-divider"></div>

      <div class="side-section room-control">
        <div class="room-header sticky-header">
          <span class="info-label section-title">特定房间设施控制</span>
          <select v-model="selectedRoomId" class="room-selector">
            <option
              v-for="room in currentFloorRooms"
              :key="room.room_id"
              :value="room.room_id"
            >
              {{ currentBuilding }}{{ currentFloor
              }}{{ room.room_id.split('-').pop().padStart(2, '0') }}
            </option>
          </select>
        </div>

        <div class="params-container" v-if="currentConfig">
          <div
            v-for="(val, key) in flatRoomParams"
            :key="key"
            class="param-item"
          >
            <span class="param-name">{{ key }}</span>
            <div class="input-with-unit">
              <input
                :type="isEditing ? 'text' : 'button'"
                v-model="roomState[selectedRoomId][key]"
                :disabled="!isEditing"
                class="edit-input short-input"
              />
              <span class="unit-text">{{ unitMap[key] || '' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="special-control-bar" v-if="isEditing">
      <div class="info-item">
        <span class="info-label">设施编号：</span>
        <input
          type="text"
          v-model="specialCmd.id"
          placeholder="网络辐控器、空调、门、水龙头等设施编号"
          class="edit-input"
        />
      </div>
      <div class="info-item">
        <span class="info-label">控制指令描述：</span>
        <input
          type="text"
          v-model="specialCmd.desc"
          placeholder="开关状态、物理位移、性能调节等操作"
          class="edit-input"
        />
      </div>
    </div>

    <div class="action-row bottom-right">
      <button v-if="!isEditing" class="tool-btn" @click="startEdit">
        编辑
      </button>
      <template v-else>
        <button class="tool-btn" @click="cancelEdit">取消</button>
        <button class="tool-btn" @click="saveEdit">保存</button>
      </template>
    </div>

    <Toast ref="toastRef" class="HÖÐR" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Toast from '../../../components/common/BaseToast.vue';
// 确保导入名称一致
import infrastructureData from '../../../data/HÖÐR/infrastructureData.json';

const currentBuilding = ref('M');
const currentFloor = ref(1);
const isEditing = ref(false);
const selectedRoomId = ref('');
const specialCmd = ref({ id: '', desc: '' });
const toastRef = ref(null);

// --- 1. 新增：定义并初始化公共区域参数 ---
const publicPowerParams = ref({
  供电状态: '正常',
  负载率: '42', // 去掉 %
  UPS储备: '98', // 去掉 %
  照明强度: '400', // 去掉 lux
  负载: '12.5', // 新增一个数值示例
  温度: '24.5', // 去掉 °C
  湿度: '45', // 去掉 %
});

// --- 2. 新增：定义并初始化房间状态字典 ---
const roomState = ref({});

// 初始化函数：将 JSON 数据转化为可编辑的状态对象
const initRoomState = () => {
  infrastructureData.forEach((room) => {
    const id = room.room_id;

    // 为每个房间生成稍微不同的初始值，模拟真实场景
    // 使用房间 ID 的哈希或简单随机数
    const seed = id.split('-').reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
    const randomShift = (range) => ((seed % range) - range / 2) / 10;

    roomState.value[id] = {
      // 基础值 + 基于 ID 的微调
      水温: (25 + randomShift(50)).toFixed(1), // 22.5 ~ 27.5 之间
      水压: (0.4 + randomShift(2)).toFixed(2), // 0.3 ~ 0.5 之间
      最大流量: (12 + (seed % 5)).toString(),
      供水时段: '00:00-24:00',
      电压: 220, // 215 ~ 225 之间
      最大电流: (16 + (seed % 4)).toString(),
      照明强度: (400 + (seed % 100)).toString(),
      UPS阈值: '15',
      温度: (24.5 + randomShift(30)).toFixed(1), // 23.0 ~ 26.0 之间
      湿度: (45 + (seed % 20)).toString(), // 45 ~ 65 之间
      换气频率: '12',
    };
  });
};

// --- 新增：单位映射表 (用于在模板中自动显示单位) ---
const unitMap = {
  水温: '°C',
  水压: 'MPa',
  最大流量: 'L/min',
  电压: 'V',
  最大电流: 'A',
  照明强度: 'lux',
  UPS阈值: '%',
  温度: '°C',
  湿度: '%',
  换气频率: '次/h',
  负载率: '%',
  UPS储备: '%', // 公共区域单位
};

// --- 3. 修正：楼层选项逻辑 ---
const floorOptions = computed(() => {
  return currentBuilding.value === 'M' ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2];
});

watch(currentBuilding, () => {
  currentFloor.value = 1;
});

// 监听楼层或建筑变化，自动切换选中的房间
watch(
  [currentBuilding, currentFloor],
  () => {
    if (currentFloorRooms.value.length > 0) {
      selectedRoomId.value = currentFloorRooms.value[0].room_id;
    }
  },
  { immediate: false }
);

const floorPlanSrc = computed(() => {
  return new URL(
    `../../../assets/data/images/buildings/${currentBuilding.value}-${currentFloor.value}.png`,
    import.meta.url
  ).href;
});

const currentFloorRooms = computed(() => {
  const prefix = `${currentBuilding.value}-${currentFloor.value}-`;
  return infrastructureData.filter((r) => r.room_id.startsWith(prefix));
});

// 确保这个计算属性在工作
const currentConfig = computed(() => {
  return infrastructureData.find((r) => r.room_id === selectedRoomId.value);
});

// 这个过滤逻辑会根据 config 决定显示哪些组，
// 并从 roomState[selectedRoomId.value] 提取该房间特有的数值
const filteredParamGroups = computed(() => {
  const config = currentConfig.value;
  const roomId = selectedRoomId.value;

  // 1. 安全检查：如果没有配置或没有初始化状态，返回空
  if (!config || !roomState.value[roomId]) return [];

  const groups = [];
  const allState = roomState.value[roomId];

  // 2. 严格判断：只有当 JSON 中 water 为 'yes' 时才推入“水”组
  if (config.water === 'yes') {
    groups.push({
      name: '水',
      params: filterParams(allState, ['水温', '水压', '最大流量', '供水时段']),
    });
  }

  // 3. 电力判断
  if (config.electricity === 'yes') {
    groups.push({
      name: '电',
      params: filterParams(allState, [
        '电压',
        '最大电流',
        '照明强度',
        'UPS阈值',
      ]),
    });
  }

  // 4. 环控判断 (包含温度、湿度、空气)
  if (
    config.temperature === 'yes' ||
    config.humidity === 'yes' ||
    config.air === 'yes'
  ) {
    groups.push({
      name: '环控',
      params: filterParams(allState, ['温度', '湿度', '换气频率']),
    });
  }

  return groups;
});

// 新增：将分组数据拍平，对齐公共区域的数据结构
const flatRoomParams = computed(() => {
  const config = currentConfig.value;
  const roomId = selectedRoomId.value;
  if (!config || !roomState.value[roomId]) return {};

  const allState = roomState.value[roomId];
  let combined = {};

  // 根据 JSON 配置，决定哪些参数进入“待显示”大池子
  if (config.water === 'yes') {
    Object.assign(
      combined,
      filterParams(allState, ['水温', '水压', '最大流量', '供水时段'])
    );
  }
  if (config.electricity === 'yes') {
    Object.assign(
      combined,
      filterParams(allState, ['电压', '最大电流', '照明强度', 'UPS阈值'])
    );
  }
  if (
    config.temperature === 'yes' ||
    config.humidity === 'yes' ||
    config.air === 'yes'
  ) {
    Object.assign(
      combined,
      filterParams(allState, ['温度', '湿度', '换气频率'])
    );
  }

  return combined;
});

const filterParams = (stateObj, keys) => {
  const res = {};
  keys.forEach((k) => {
    if (stateObj[k]) res[k] = stateObj[k];
  });
  return res;
};

// 生命周期钩子：初始化数据
onMounted(() => {
  initRoomState();
  if (currentFloorRooms.value.length > 0) {
    selectedRoomId.value = currentFloorRooms.value[0].room_id;
  }
});

const startEdit = () => {
  isEditing.value = true;
};
const cancelEdit = () => {
  isEditing.value = false;
};
const saveEdit = () => {
  toastRef.value.show('已禁用控制操作 至 20730928 00:00:00');
};
</script>

<style scoped>
/* --- 基础容器 --- */
.module-infrastructure {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 核心：彻底关掉浏览器最外层的滚动条 */
}

/* --- 第一部分：顶部导航/搜索栏 (仅保留特有布局覆写) --- */
.search-bar {
  justify-content: space-between;
}
.tool-group {
  display: flex;
  gap: 5px;
  align-items: center;
}

/* --- 第二部分：平面图区域 (核心逻辑：图片变色) --- */
.floor-plan-container {
  flex: 0 0 400px;
  /* 确保这里没有背景色，或者背景色就是你操作区的深色 */
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  /* --- 关键修改：防止内容溢出 --- */
  overflow: hidden;
  position: relative;
  width: 100%; /* 确保宽度不超出父级 module-infrastructure */
}

.themed-map {
  /* --- 关键修改：使用 max-width/height 配合 object-fit --- */
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持比例缩放，确保图片完整显示在框架内 */
  filter: invert(100%) sepia(100%) saturate(1000%) hue-rotate(50deg)
    brightness(120%) contrast(150%);
  /* 混合模式： screen 过滤暗色 (原白色变黑的部分) */
  mix-blend-mode: multiply;
  /* 确保父容器背景是透明或深色，否则 screen 效果不明显 */
  background-color: transparent;
  transition: all 0.5s ease;
}

/* --- 第三部分：参数控制区 --- */
/* 修改控制面板为左右布局 */
.control-panel {
  display: flex;
  flex-direction: row; /* 关键：改为横向排列 */
  width: 100%; /* 撑满父容器 */
  overflow: hidden; /* 防止内部溢出破坏布局 */
  box-sizing: border-box;
  padding: 15px; /* 这里的内边距会决定内部参数离边框的距离 */
  /* 关键：利用 flex-grow 让它占据剩余空间，并限制高度 */
  flex: 1;
  min-height: 0; /* 允许内容收缩，这是 flex 容器内部滚动的关键 */
}

/* 修改：侧边栏容器，确保它们能各自垂直堆叠标题和网格 */
.side-section {
  flex: 1;
  display: flex;
  flex-direction: column; /* 纵向排列标题和下方的网格 */
  gap: 15px;
  min-width: 0;
  overflow-x: hidden;
  height: 100%; /* 确保撑满 control-panel */
}

.sticky-header {
  position: sticky;
  top: 0; /* 吸附在顶部 */
  z-index: 10; /* 确保在参数条目上方 */
  background: transparent; /* ！！！重要：必须设置背景色，否则滚动时文字会重叠 */
  padding-bottom: 10px;
  margin-bottom: 5px;
  border-bottom: var(--border-one); /* 增加一条细线区分 */
}

/* 标题样式强化 */
.section-title {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  border-left: var(--border-left);
  padding-left: 10px;
  color: var(--primary);
}

/* 垂直分割线 */
.vertical-divider {
  width: 1px;
  border-left: 1px dashed var(--bg-mask);
  margin: 0 10px;
}

/* 房间控制顶部的排列 */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 5px;
  background: transparent; /* 可以设为透明了 */
  flex-shrink: 0; /* 关键：防止标题被压缩 */
}

/* 统一左右两侧的网格布局 */
.params-container {
  display: grid;
  /* 调整 minmax 确保一行能排下 2-3 个 */
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  width: 100%;

  /* 滚动控制 */
  flex: 1; /* 自动填满剩余空间 */
  overflow-y: auto; /* 滚动条只在这里出现 */
  overflow-x: hidden;
  padding-right: 5px; /* 为滚动条留出一点空隙，防止遮挡单位 */
}

.param-item {
  background: var(--bg-panel);
  padding: 5px 10px; /* 减少内边距 */
  border: var(--border-one);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px; /* 稍微减矮一点，更紧凑 */
}

/* 缩小名称宽度 */
.param-name {
  font-size: var(--text-base);
  color: var(--primary);
  min-width: 50px; /* 从 65px 缩小到 50px */
  white-space: nowrap;
}

/* 输入框和单位的组合 */
.input-with-unit {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 缩短输入框和单位 */
.edit-input.short-input {
  width: 40px; /* 从 60px 缩短到 40px */
  outline: none;
  box-shadow: none;
  flex: none;
  font-size: var(--text-base);
  text-align: center; /* 改为居中，窄的时候更好看 */
}

.unit-text {
  font-size: var(--text-base);
  min-width: 25px; /* 从 35px 缩小到 25px */
}

.public-power {
  padding-left: 15px;
}

/* 关键修复：删掉之前的 align-items: flex-start，避免内容被挤压 */
.room-control {
  display: flex;
  flex-direction: column;
}

.room-selector {
  width: 90px;
  background: #000;
  color: var(--primary);
  border: var(--border-base);
  padding: 5px;
  outline: none;
}

/* --- 第四部分：特殊控制区 --- */
.special-control-bar {
  width: 100%; /* 确保宽度 100% */
  box-sizing: border-box;
  display: flex;
  gap: 30px; /* 两个输入组之间的间距 */
  padding: 15px;
  background: rgba(255, 68, 68, 0.05);
  border: 1px solid rgba(255, 68, 68, 0.2);
}

/* 核心：让 label 和 input 在同一行显示 */
.special-control-bar .info-item {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  flex: 1; /* 如果想平分宽度就加这个，不想就去掉 */
  white-space: nowrap; /* 防止标签文字换行 */
}

/* 调整标签样式 */
.special-control-bar .info-label {
  width: auto; /* 取消之前的固定宽度，让它随文字长度变化 */
  margin-right: 10px; /* 文本和输入框之间的距离 */
  color: var(--primary);
  opacity: 0.9;
}

/* 调整输入框样式 */
.special-control-bar .edit-input {
  flex: 1; /* 让输入框自动填满剩余空间 */
  max-width: 300px; /* 限制一个最大宽度防止太长 */
  background: transparent;
  border-bottom: var(--border-base);
  color: #fff;
  padding: 0px 5px;
}

/* --- 第五部分：按钮区 --- */
.action-row.bottom-right {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: auto;
  padding-top: 10px;
}

/* --- 统一输入控件 (复用原样式) --- */
/* 保持输入框不缩写 */
.edit-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  border-bottom: var(--border-base);
  color: #fff;
  text-align: left;
  font-size: var(--text-base);
}

.edit-input:focus {
  outline: none;
  box-shadow: none;
}

.edit-input:disabled {
  border-bottom: var(--border-one);
  color: rgba(255, 255, 255, 0.6);
  cursor: not-allowed;
}

/* --- 动画 --- */
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

/* 自定义滚动条 */
.params-container::-webkit-scrollbar {
  width: 4px; /* 滚动条宽度 */
}

.params-container::-webkit-scrollbar-track {
  background: rgba(150, 230, 161, 0.1); /* 轨道背景 primary*/
  border-radius: 10px;
}

.params-container::-webkit-scrollbar-thumb {
  background: rgba(150, 230, 161, 0.4); /* 滑块颜色（你的主色调绿/蓝） */
  border-radius: 10px;
}

.params-container::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 230, 161, 0.8); /* 悬停时颜色变实，增加反馈 */
}
</style>
