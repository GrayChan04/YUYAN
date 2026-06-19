// 在 HÖÐR.vue 或公用工具脚本中
const STORAGE_KEY = 'UNLOCKED_LIST';

// 检查是否已解锁
const checkIsUnlocked = (uniqueId) => {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return list.includes(uniqueId);
};

// 记录解锁成功
const saveUnlockStatus = (uniqueId) => {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!list.includes(uniqueId)) {
    list.push(uniqueId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
};