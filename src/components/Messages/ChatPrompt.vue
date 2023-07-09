<template>
  <v-card
    ref="root"
    class="message prompt"
    :class="props.isThread ? 'thread-prompt' : ''"
  >
    <pre>{{ message.content }} </pre>
    <v-btn
      flat
      size="x-small"
      icon
      @click="copyToClipboard"
      class="copy_btn_bg"
    >
      <v-icon>mdi-content-copy</v-icon>
    </v-btn>
    <v-btn
      flat
      size="x-small"
      icon
      @click="setPrompt"
      class="copy_btn_bg"
    >
      <v-icon>mdi-pencil-outline</v-icon>
    </v-btn>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();
const root = ref();
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  columns: {
    type: Number,
    required: true,
  },
  isThread: {
    type: Boolean,
    default: false,
  },
});
const message = ref({ ...props.message });
message.value.content = message.value.content.replace(/Replied by.+$/, "");
watch(
  () => props.columns,
  () => {
    root.value.$el.style.setProperty("--columns", props.columns);
  },
);

onMounted(() => {
  root.value.$el.style.setProperty("--columns", props.columns);
});
function copyToClipboard() {
  let content = message.value.content;
  navigator.clipboard.writeText(content);
}
function setPrompt() {
  let content = message.value.content;
  store.commit("setPrompt", content);
}
</script>

<style scoped>
.message {
  border-radius: 8px;
  padding: 16px;
  word-wrap: break-word;
  text-align: left;
}

.prompt {
  display: flex;
  align-items: center;
  background-color: rgb(var(--v-theme-prompt));
  width: fit-content;
  grid-column: 1 / span var(--columns);
}

.prompt pre {
  white-space: pre-wrap;
  font-family: inherit;
}

.thread-prompt {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.copy_btn_bg {
  background-color: inherit;
}
</style>
