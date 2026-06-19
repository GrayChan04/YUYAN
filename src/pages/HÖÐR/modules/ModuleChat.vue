<template>
  <div class="module-chat">
    <!-- 左侧联系人 -->
    <aside class="chat-sidebar">
      <div
        v-for="(c, key) in contacts"
        :key="key"
        class="contact-item"
        :class="{ active: key === activeContact }"
        @click="switchContact(key)"
      >
        <span class="dot" v-if="unreadMap[key] > 0"></span>
        <span class="name">{{ c.name }}</span>
      </div>
    </aside>

    <!-- 右侧主区域 -->
    <section class="chat-main">
      <!-- 顶部联系人名 -->
      <header class="chat-header">
        {{ currentContactName }}
      </header>

      <!-- 消息区 -->
      <div class="chat-messages" ref="msgBoxRef">
        <template v-for="(msg, index) in visibleMessages" :key="index">
          <!-- 日期分割 -->
          <div v-if="isNewDay(index)" class="date-divider">
            {{ formatDateDivider(msg.time) }}
          </div>

          <!-- 消息 -->
          <div class="message" :class="msg.user === account ? 'me' : 'other'">
            <div class="msg-user">{{ msg.user }}</div>

            <div class="msg-content">
              {{ msg.content }}
            </div>

            <div class="msg-time" :title="msg.time">
              {{ formatTime(msg.time) }}
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区 -->
      <footer class="chat-input">
        <input
          v-model="inputText"
          class="input-box"
          :placeholder="inputPlaceholder"
          @keydown.enter="handleSend"
        />

        <button class="send-btn" @click="handleSend">SEND</button>
      </footer>
    </section>

    <!-- Toast -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import Toast from '../../../components/common/BaseToast.vue';

const props = defineProps({
  chatData: { type: Object, required: true },
  account: { type: String, required: true },

  sendMode: { type: String, default: 'custom' }, // toast | hint | custom
  toastMessage: { type: String, default: '现在还是不要随意发送消息为好' },
  inputPlaceholder: { type: String, default: '请输入关键词' },

  visibleMap: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['send']);

/* ---------------- state ---------------- */

const toastRef = ref();
const msgBoxRef = ref();

const inputText = ref('');
const activeContact = ref(null);

const unreadMap = ref({});

/* ---------------- computed ---------------- */

const contacts = computed(() => {
  return props.chatData?.[props.account] || {};
});

const contactKeys = computed(() => Object.keys(contacts.value));

const currentContact = computed(() => {
  return contacts.value[activeContact.value] || {};
});

const currentContactName = computed(() => {
  return currentContact.value?.name || '';
});

const visibleMessages = computed(() => {
  const list = currentContact.value?.chat_list || [];
  const limit = props.visibleMap?.[activeContact.value];
  return limit ? list.slice(0, limit) : list;
});

/* ---------------- init ---------------- */

onMounted(() => {
  if (contactKeys.value.length > 0) {
    activeContact.value = contactKeys.value[0];
  }

  contactKeys.value.forEach((k) => {
    unreadMap.value[k] = 0;
  });
});

/* ---------------- contact switch ---------------- */

function switchContact(key) {
  activeContact.value = key;
  unreadMap.value[key] = 0;
  scrollToBottom();
}

/* ---------------- send ---------------- */

function handleSend() {
  const text = inputText.value.trim();
  if (!text) return;

  if (props.sendMode === 'toast') {
    toastRef.value?.show(props.toastMessage);
  }

  if (props.sendMode === 'hint') {
    inputText.value = props.inputPlaceholder;
    setTimeout(() => {
      inputText.value = '';
    }, 800);
  }

  if (props.sendMode === 'custom') {
    emit('send', text);
    inputText.value = '';
  }
}

/* ---------------- utils ---------------- */

function scrollToBottom() {
  nextTick(() => {
    if (msgBoxRef.value) {
      msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight;
    }
  });
}

function formatTime(t) {
  if (!t) return '';
  return `${t.slice(0, 4)}.${t.slice(4, 6)}.${t.slice(6, 8)} ${t.slice(9, 14)}`;
}

function formatDateDivider(t) {
  if (!t) return '';
  return `${t.slice(0, 4)}.${t.slice(4, 6)}.${t.slice(6, 8)}`;
}

function isNewDay(index) {
  const list = visibleMessages.value;
  if (index === 0) return true;

  const prev = list[index - 1]?.time?.slice(0, 8);
  const curr = list[index]?.time?.slice(0, 8);

  return prev !== curr;
}
</script>

<style scoped>
.module-chat {
  display: flex;
  height: 100%;
  width: 100%;
  background: var(--bg);
  color: var(--primary);
  overflow: hidden;
}

/* sidebar */
.chat-sidebar {
  width: 220px;
  border-right: 1px solid var(--bg-mask);
  padding: 10px;
  overflow-y: auto;
}

.contact-item {
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-normal);
}

.contact-item.active {
  background: var(--bg-mask);
  color: var(--primary);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

/* main */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* header */
.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--bg-mask);
  font-size: var(--text-title);
}

/* messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-divider {
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
  margin: 10px 0;
}

/* message */
.message {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.other {
  align-self: flex-start;
  text-align: left;
}

.message.me {
  align-self: flex-end;
  text-align: right;
}

.msg-user {
  font-size: 12px;
  opacity: 0.7;
}

.msg-content {
  padding: 10px 12px;
  border: 1px solid var(--bg-mask);
  background: transparent;
  white-space: pre-wrap;
}

.message.me .msg-content {
  border-color: var(--primary);
}

.msg-time {
  font-size: 10px;
  opacity: 0.5;
}

/* input */
.chat-input {
  border-top: 1px solid var(--bg-mask);
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.input-box {
  flex: 1;
  background: transparent;
  border: 1px solid var(--bg-mask);
  color: var(--primary);
  padding: 8px;
  outline: none;
}

.send-btn {
  padding: 8px 16px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  cursor: pointer;
}

.send-btn:hover {
  background: var(--bg-mask);
}
</style>
