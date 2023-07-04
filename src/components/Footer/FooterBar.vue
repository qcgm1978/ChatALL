<template>
  <!-- <div class="footer"> -->
  <!-- v-shortkey.once="{
      focusPromptTextarea: SHORTCUT_PROMPT_TEXTAREA.key,
      toggleBotsMenu: SHORTCUT_BOTS_MENU.key,
    }"
    @shortkey="handleShortcut" -->
  <!-- <v-autocomplete
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
      auto-gro vbw
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
      @click="sendPromptToBots" -->
  <v-bottom-navigation class="footer" v-shortkey.once="{
    focusPromptTextarea: SHORTCUT_PROMPT_TEXTAREA.key,
    toggleBotsMenu: SHORTCUT_BOTS_MENU.key,
  }" @shortkey="handleShortcut">
    <div style="
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: flex-end;
      ">
      <v-textarea :id="SHORTCUT_PROMPT_TEXTAREA.elementId" v-model="prompt" ref="promptTextArea" auto-grow max-rows="8.5"
        rows="1" density="comfortable" hide-details variant="solo" :placeholder="$t('footer.promptPlaceholder')" autofocus
        @keydown="filterEnterKey" style="min-width: 390px"></v-textarea>
      <v-btn class="send-prompt-btn" elevation="2" :disabled="prompt.trim() === '' ||
        favBots.filter((favBot) => activeBots[favBot.classname]).length === 0
        " @click="sendPromptToBots">
        {{ $t("footer.sendPrompt") }}
      </v-btn>
      <div class="bot-logos" ref="favBotLogosRef" :key="rerenderFavBotLogos">
        <BotLogo v-for="(bot, index) in favBots" :id="`fav-bot-${index + 1}`" :key="index" :bot="bot.instance"
          :active="activeBots[bot.classname]" :data-id="bot.classname" size="36" @click="toggleSelected(bot.instance)" />
        <!-- v-shortkey.once="['ctrl', `${index + 1}`]"
          @shortkey="toggleSelected(bot.instance)" -->
      </div>
      <BotsMenu style="padding-bottom: 0.5rem; padding-left: 4px" :id="SHORTCUT_BOTS_MENU.elementId" ref="botsMenuRef"
        :favBots="favBots" />
    </div>
    <MakeAvailableModal v-model:open="isMakeAvailableOpen" :bot="clickedBot" />
    <ConfirmModal ref="confirmModal" />
  </v-bottom-navigation>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeMount,
  reactive,
  watch,
  nextTick,
} from "vue";
import { useStore } from "vuex";
import Sortable from "sortablejs";

// Components
import MakeAvailableModal from "@/components/MakeAvailableModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import BotLogo from "./BotLogo.vue";
import BotsMenu from "./BotsMenu.vue";
import {
  SHORTCUT_PROMPT_TEXTAREA,
  SHORTCUT_BOTS_MENU,
} from "./../ShortcutGuide/shortcut.const";

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
const favBotLogosRef = ref();

const bots = ref(_bots.all);
const activeBots = reactive({});
const rerenderFavBotLogos = ref(0);
const favBots = computed(() => {
  const _favBots = [];
  store.getters.currentChat.favBots.forEach((favBot) => {
    if (_bots.isBotDisabled(favBot.classname)) return;
    _favBots.push({
      ...favBot,
      instance: _bots.getBotByClassName(favBot.classname),
    });
  });
  return _favBots.sort((a, b) => a.order - b.order); // sort by order property
});

const prompt = ref("");
const clickedBot = ref(null);
const isMakeAvailableOpen = ref(false);
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
  promptTextArea.value.focus();
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
function adaptColumns(num) {
  props.changeColumns(num >= 3 ? 3 : num);
}

function sendPromptToBots() {
  if (prompt.value.trim() === "") return;

  const toBots = favBots.value
    .filter((favBot) => activeBots[favBot.classname])
    .map((favBot) => favBot.instance);

  if (toBots.length === 0) return;
  const val = store.state.enableRepliedLang ? `${prompt.value}. Replied by ${store.state.langName}` : prompt.value;
  store
    .dispatch("sendPrompt", {
      prompt: val,
      bots: toBots,
      error_callback: open_bot
    })
    .then((promises) => {
      Promise.allSettled(promises).then((ps) => {
        shortkey_disabled.value = true;
        adaptColumns(toBots.length);
        const rejected = ps.filter((d) => d.status == "rejected");
        if (rejected.length) {
          rejected.forEach((e) => {
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
        open_bot(bot);
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

onMounted(() => {
  initializeSortable();
});

let sortable = undefined;
function open_bot(bot) {
  clickedBot.value = bot;
  isMakeAvailableOpen.value = true;
}

function initializeSortable() {
  sortable = new Sortable(favBotLogosRef.value, {
    animation: 200, // ms, animation speed moving items when sorting
    // dragging ended
    onEnd: async function (favBot) {
      if (favBot.oldIndex === favBot.newIndex) {
        return; // order not changed, return
      }
      store.commit("setFavBotOrder", sortable.toArray());
      rerenderFavBotLogos.value++; // trigger re-render to refresh order and shortkey
      nextTick().then(() => {
        sortable = undefined;
        initializeSortable(); // re-initialize sortable instance after re-render
      });
    },
  });
}

defineExpose({
  focusPromptTextarea,
});
</script>

<style scoped>
.footer {
  background-color: transparent !important;
  height: auto !important;
  display: flex;
  align-items: center !important;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  box-sizing: border-box;
  padding-bottom: .5rem;
  box-shadow: none !important;
}

.bot-logos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding-bottom: 0.5rem;
  overflow: hidden;
  height: 40px;
  margin: auto;
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

:deep() .v-field__field>textarea {
  overflow-y: auto;
}

.send-prompt-btn {
  height: 40px !important;
  margin: 0.4rem !important;
  text-transform: uppercase !important;
  font-size: small !important;
  color: rgb(var(--v-theme-on-primary));
  background-color: rgb(var(--v-theme-primary));
  border-radius: 4px !important;
}
</style>
