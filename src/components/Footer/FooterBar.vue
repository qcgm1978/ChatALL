<template>
  <div class="footer">
    <!-- :custom-filter="filterItems"
    :item-text="itemText"
    :label="$t('footer.promptPlaceholder')"
  -->
    <v-autocomplete
      v-model="prompt"
      :items="autocompleteItems"
      item-title="name"
      item-value="ind"
      :menu-props="{ closeOnContentClick: true }"
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
        :key="index"
        :bot="bot.instance"
        :active="activeBots[bot.classname]"
        size="36"
        @click="toggleSelected(bot.instance)"
      />
      <BotsMenu :favBots="favBots" />
    </div>
    <MakeAvailableModal v-model:open="isMakeAvailableOpen" :bot="clickedBot" />
    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount, reactive, watch } from "vue";
import { useStore } from "vuex";
const axios = require("axios");

// Components
import MakeAvailableModal from "@/components/MakeAvailableModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import BotLogo from "./BotLogo.vue";
import BotsMenu from "./BotsMenu.vue";

// Composables

import _bots from "@/bots";
const autocompleteItems = computed(() => {
  const messages = store.getters.currentChat.messages.filter(
    (message) => !message.hide,
  );
  const items = messages
    .filter((d) => d.type == "prompt")
    .map((d, i) => ({ name: d.content, ind: d.content }));
  const set = new Set(items);
  const its = Array.from(set);
  return its;
});
const itemText = () => {
  return "text"; // 指定选项的文本属性名
};
const filterItems = (item, queryText, itemText) => {
  const is_filter = item.toLowerCase().indexOf(queryText.toLowerCase()) > -1;
  return is_filter; // 过滤选项
};
const props = defineProps([
  "changeColumns",
  // 'confirmModal'
]);
const { ipcRenderer } = window.require("electron");

const store = useStore();

const confirmModal = ref(null);

const bots = ref(_bots.all);
const activeBots = reactive({});
const favBots = computed(() => {
  const _favBots = [];
  store.getters.currentChat.favBots.forEach((favBot) => {
    _favBots.push({
      ...favBot,
      instance: _bots.getBotByClassName(favBot.classname),
    });
  });
  return _favBots;
});

const prompt = ref("");
const clickedBot = ref(null);
const isMakeAvailableOpen = ref(false);
const disabled = ref(true);

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
watch(prompt, (newValue, oldValue) => {
  const dis =
    newValue &&
    (newValue.trim() === "" ||
      favBots.value.filter((favBot) => activeBots[favBot.classname]).length ===
        0);
  disabled.value = dis;
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

// Send the prompt when the user presses enter and prevent the default behavior
// But if the shift, ctrl, alt, or meta keys are pressed, do as default
function filterEnterKey(event) {
  if (
    event.keyCode == 13 &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    sendPromptToBots();
  }
}
function changePrompt(evt) {
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
        adaptColumns(toBots.length);
        const rejected = promises.filter((d) => d.status == "rejected");
        if (rejected.length) {
          rejected.forEach((bot) => {
            clickedBot.value = bot.reason.bot;
            isMakeAvailableOpen.value = true;
          });
          // Clear the textarea after sending the prompt
        } else {
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
  background-color: rgba(243, 243, 243, 0.7);
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
</style>
