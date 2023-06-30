<template>
  <div class="footer">
    <!-- v-shortkey.once="{
      focusPromptTextarea: SHORTCUT_PROMPT_TEXTAREA.key,
      toggleBotsMenu: SHORTCUT_BOTS_MENU.key,
    }"
    @shortkey="handleShortcut" -->
    <v-autocomplete
      :id="SHORTCUT_PROMPT_TEXTAREA.elementId"
      v-model="prompt"
      ref="promptTextArea"
      :items="autocompleteItems"
      item-title="name"
      item-value="ind"
      :menu-props="{ closeOnContentClick: true }"
      :hide-no-data="true"
      theme="store.state.theme"
      bg-color="purple"
      clearable
      :label="$t('footer.promptPlaceholder')"
      auto-grow
      max-rows="8.5"
      rows="1"
      density="comfortable"
      hide-details
      variant="solo"
      autofocus
      @keydown="filterEnterKey"
      @input="changePrompt"
      style="min-width: 390px"
    ></v-autocomplete>
    <v-btn
      color="primary"
      elevation="2"
      class="margin-bottom"
      :disabled="disabled"
      @click="sendPromptToBots"
    >
      {{ $t("footer.sendPrompt") }}
    </v-btn>
    <div class="bot-logos margin-bottom">
      <BotLogo
        v-for="(bot, index) in favBots"
        :id="`fav-bot-${index + 1}`"
        :key="index"
        :bot="bot.instance"
        :active="activeBots[bot.classname]"
        size="36"
        @click="toggleSelected(bot.instance)"
      />
      <!-- v-shortkey.once="['ctrl', `${index + 1}`]"
        v-shortkey.disabled="shortkey_disabled"
        @shortkey="toggleSelected(bot.instance)" -->
      <BotsMenu
        :id="SHORTCUT_BOTS_MENU.elementId"
        ref="botsMenuRef"
        :favBots="favBots"
      />
    </div>
    <MakeAvailableModal v-model:open="isMakeAvailableOpen" :bot="clickedBot" />
    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount, reactive, watch, toRefs } from "vue";

import { useStore } from "vuex";

// Components
import MakeAvailableModal from "@/components/MakeAvailableModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import BotLogo from "./BotLogo.vue";
import BotsMenu from "./BotsMenu.vue";
import {
  SHORTCUT_PROMPT_TEXTAREA,
  SHORTCUT_BOTS_MENU,
} from "./../ShortcutGuide/shortcut.const";

// Composables

import _bots from "@/bots";
const { ipcRenderer } = window.require("electron");
const autocompleteItems = computed(() => {
  const messages = store.getters.currentChat.messages.filter(
    (message) => !message.hide,
  );
  const items = messages
    // .filter((d) => d.type == "prompt")
    .map((d, i) => ({ name: d.content, ind: d.content }));
  const set = new Set(items);
  const its = Array.from(set);
  // .slice(0, 10);
  return its;
});
const props = defineProps(["changeColumns"]);

const store = useStore();

const confirmModal = ref(null);
const promptTextArea = ref(null);
const botsMenuRef = ref(null);

const bots = ref(_bots.all);
const activeBots = reactive({});
const favBots = computed(() => {
  const _favBots = [];
  store.getters.currentChat.favBots.forEach((favBot) => {
    if (_bots.isBotDisabled(favBot.classname)) return;
    _favBots.push({
      ...favBot,
      instance: _bots.getBotByClassName(favBot.classname),
    });
  });
  return _favBots;
});

const prompt = ref("");
// 创建一个响应式对象
const prompt_reactive = reactive({
  value: "",
});

// 将响应式对象转换为普通对象，以便在模板中使用
// const { prompt } = toRefs(prompt_reactive);

// 输出结果
console.log(prompt.value); // 'New Value'

const clickedBot = ref(null);
const isMakeAvailableOpen = ref(false);
const disabled = ref(true);
const shortkey_disabled = ref(true);

watch(favBots, async (newValue, oldValue) => {
  const botsToCheck = newValue.filter((newBot) => {
    return !oldValue.some((oldBot) => oldBot.classname === newBot.classname);
  });
  await botsToCheck.forEach(async (favBot) => {
    const bot = favBot.instance;
    if (!bot.isAvailable()) {
      await bot.checkAvailability();
      updateActiveBots();
    }
  });
  updateActiveBots();
});
// watch(prompt, (newValue, oldValue) => {
//   const dis =
//     newValue &&
//     (newValue.trim() === "" ||
//       favBots.value.filter((favBot) => activeBots[favBot.classname]).length ===
//         0);
//   disabled.value = dis;
// });
async function updateActiveBots() {
  for (const bot of store.getters.currentChat.favBots) {
    // Unselect the bot if user has not confirmed to use it
    const favBot = favBots.value.find((d) => d.classname == bot.classname);
    favBot.selected = bot.selected;
    if (favBot.selected) {
      const confirmed = await favBot.instance.confirmBeforeUsing(
        confirmModal.value,
      );
      // if (!confirmed) {
      store.commit("setBotSelected", {
        botClassname: favBot.classname,
        selected: confirmed,
      });
      // }
    }
    const val = favBot.instance.isAvailable() && favBot.selected;
    activeBots[favBot.classname] = val;
  }
  // store.commit("updateCurrentChatFavBots", activeBots);
}

function focusPromptTextarea() {
  promptTextArea.value.$el.querySelector("textarea").focus();
}

function toggleBotsMenu() {
  botsMenuRef.value.toggleMenu();
}

function handleShortcut(event) {
  if (event.srcKey === "focusPromptTextarea") {
    focusPromptTextarea();
  } else if (event.srcKey === "toggleBotsMenu") {
    toggleBotsMenu();
  }
}

// Send the prompt when the user presses enter and prevent the default behavior
// But if the shift, ctrl, alt, or meta keys are pressed, do as default
function filterEnterKey(event) {
  if (
    prompt.value &&
    event.keyCode == 13 &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey
  ) {
    promptTextArea.value.menu = false;
    shortkey_disabled.value = false;
    event.preventDefault();
    sendPromptToBots();
  }
}
function changePrompt(evt) {
  promptTextArea.value.menu = false;
  const value = evt.target.value;
  if (
    value
    // && !autocompleteItems.value.includes(value)
  ) {
    // autocompleteItems.value.push(value);
    prompt.value = value;
  }
}
function adaptColumns(num) {
  props.changeColumns(num >= 3 ? 3 : num);
}

function sendPromptToBots() {
  if (prompt.value.trim() === "") return;

  const toBots = favBots.value
    .filter((favBot) => activeBots[favBot.classname])
    .map((favBot) => favBot.instance);

  if (toBots.length === 0) return;
  store
    .dispatch("sendPrompt", {
      prompt: prompt.value,
      bots: toBots,
    })
    .then((checkAvailabilityPromises) => {
      Promise.allSettled(checkAvailabilityPromises).then((promises) => {
        shortkey_disabled.value = true;
        adaptColumns(toBots.length);
        const rejected = promises.filter((d) => d.status == "rejected");
        if (rejected.length) {
          rejected.forEach((bot) => {
            const cur_bot = bot.reason.bot;
            if (cur_bot) {
              clickedBot.value = cur_bot;
              isMakeAvailableOpen.value = true;
            } else {
              throw "missing bot, reject error need add this prop";
            }
          });
        } else {
          // Clear the textarea after sending the prompt
          prompt.value = "";
        }
      });
    });
}

async function toggleSelected(bot) {
  const botClassname = bot.getClassname();
  let selected = false;
  if (activeBots[botClassname]) {
    selected = false;
  } else {
    if (bot.isAvailable()) {
      selected = true;
    } else {
      const availability = await bot.checkAvailability();
      if (!availability) {
        selected = false;
        clickedBot.value = bot;
        // Open the bot's settings dialog
        isMakeAvailableOpen.value = true;
      } else {
        selected = true;
      }
    }
  }
  store.commit("setBotSelected", { botClassname, selected });
  updateActiveBots();
}

onBeforeMount(async () => {
  favBots.value.forEach(async (favBot) => {
    if (favBot.selected) {
      const result = await favBot.instance.checkAvailability();
      favBot.selected = result;
      updateActiveBots();
    }
  });

  // Listen message trigged by main process
  ipcRenderer.on("CHECK-AVAILABILITY", async (event, url) => {
    const botsToCheck = bots.value.filter((bot) => bot.getLoginUrl() === url);
    botsToCheck.forEach(async (bot) => {
      await bot.checkAvailability();
      updateActiveBots();
    });
  });
});
</script>

<style>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  box-sizing: border-box;
}

.bot-logos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.margin-bottom {
  margin-bottom: 5px;
}

/* Override default style of vuetify v-textarea */
.v-textarea--auto-grow textarea {
  overflow: auto !important;
}

textarea::placeholder {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* .v-list-item--variant-text:hover {
    background: red!important;
} */
</style>
