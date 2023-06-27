<template>
  <v-card ref="root" class="message prompt">
    <span>{{ props.message.content }} </span>
    <v-btn flat size="x-small" icon @click="copyToClipboard">
      <v-icon>mdi-content-copy</v-icon>
    </v-btn>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

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
});

watch(
  () => props.columns,
  () => {
    root.value.$el.style.setProperty("--columns", props.columns);
  },
);

onMounted(() => {
  root.value.$el.style.setProperty("--columns", props.columns);
});
function copyToClipboard(is_code = false) {
  let content 
  if (is_code) {
    content = content
      .match(/^```([\s\S]*?)^```/gm)
      .map((d) => d.match(/\n[\s\S]+\n/gm)[0].trim());
  }
  navigator.clipboard.writeText(content);
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
    background-color: rgb(var(--v-theme-prompt));
    width: fit-content;
    grid-column: 1 / span var(--columns);
}

.prompt pre {
  white-space: pre-wrap; 
  font-family: inherit;
}
</style>
