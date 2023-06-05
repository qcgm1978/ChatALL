<template>
  <div id="app">
    <header>
      <div class="header-content">
        <img class="logo" src="@/assets/logo-banner.png" alt="ChatALL" />
        <div class="column-icons">
          <img src="@/assets/column-1.svg" @click="changeColumns(1)" :class="{ selected: columns === 1 }" />
          <img src="@/assets/column-2.svg" @click="changeColumns(2)" :class="{ selected: columns === 2 }" />
          <img src="@/assets/column-3.svg" @click="changeColumns(3)" :class="{ selected: columns === 3 }" />
        </div>
        <div>
          <v-icon class="cursor-pointer" color="primary" icon="mdi-broom" size="x-large"
            @click="clearMessages()"></v-icon>
          <v-icon class="cursor-pointer" color="primary" icon="mdi-cog" size="x-large"
            @click="openSettingsModal()"></v-icon>
        </div>
      </div>
    </header>

    <main class="content">
      <div id="content">
        <ChatMessages :columns="columns"></ChatMessages>
      </div>
      <v-card class="filter-table">
        <v-card-title>
          Nutrition
          <v-spacer></v-spacer>
          <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
        </v-card-title>
        <v-data-table :headers="headers" :items="desserts" :search="search"></v-data-table>
      </v-card>
    </main>
    <div class="bot-logos margin-bottom">
      <v-select :items="botsOptions" item-title="name" item-value="id" hide-details :model-value="selectedOptions"
        multiple @update:model-value="toggleSelected($event)"></v-select>
    </div>
    <footer>
      <v-textarea v-model="prompt" auto-grow max-rows="8.5" rows="1" density="comfortable" hide-details variant="solo"
        :placeholder="$t('footer.promptPlaceholder')" autofocus @keydown="filterEnterKey"
        style="min-width: 390px"></v-textarea>
      <v-btn color="primary" elevation="2" class="margin-bottom" :disabled="prompt.trim() === '' || Object.values(activeBots).every((bot) => !bot)
        " @click="sendPromptToBots">
        {{ $t("footer.sendPrompt") }}
      </v-btn>

    </footer>
    <MakeAvailableModal v-model:open="isMakeAvailableOpen" :bot="clickedBot"
      @done="checkAllBotsAvailability(clickedBot)" />
    <SettingsModal v-model:open="isSettingsOpen" @done="checkAllBotsAvailability()" />
    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeMount, reactive } from "vue";
import { useStore } from "vuex";
import { v4 as uuidv4 } from "uuid";

import i18n from "./i18n";
import _bots from "./bots";

// Components
import MakeAvailableModal from "@/components/MakeAvailableModal.vue";
import ChatMessages from "@/components/Messages/ChatMessages.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
// import { VListItemAvatar, VListItemContent, VListItemText } from 'vuetify/lib/components/VList'
// import Multiselect from 'vue-multiselect'

// Composables
// import { useMatomo } from "@/composables/matomo";

// Styles
import "@mdi/font/css/materialdesignicons.css";
import { VDataTable } from 'vuetify/labs/VDataTable'
const store = useStore();

const confirmModal = ref(null);
const prompt = ref("");
const bots = ref(_bots.all);
const bots_val = bots.value.map(d => ({
  logo: d.getLogo(),
  fullname: d.getFullname(),
  name: d.getFullname(),
  classname: d.getClassname(),
  id: d.getClassname(),
  isSelected: false
}));
const botsOptions = computed(_ => bots_val)
const activeBots = reactive({});
const selectedOptions = computed(_ => bots_val.filter(d => Object.keys(store.state.selectedBots).filter(k => store.state.selectedBots[k]).includes(d.classname)))
const clickedBot = ref(null);
const isSettingsOpen = ref(false);
const isMakeAvailableOpen = ref(false);
const columns = computed(() => store.state.columns);
const selectedBots = computed(() => store.state.selectedBots);

const changeColumns = (columns) => store.commit("changeColumns", columns);
const setUuid = (uuid) => store.commit("setUuid", uuid);
const setBotSelected = (uuid) => store.commit("SET_BOT_SELECTED", uuid);
// filter table(https://vuetifyjs.com/en/components/data-tables/filtering/#data-table-filtering)
const search = ref('')
const headers = reactive([
  {
    align: 'start',
    key: 'name',
    sortable: false,
    title: 'Dessert (100g serving)',
  },
  { key: 'calories', title: 'Calories' },
  { key: 'fat', title: 'Fat (g)' },
  { key: 'carbs', title: 'Carbs (g)' },
  { key: 'protein', title: 'Protein (g)' },
  { key: 'iron', title: 'Iron (%)' },
])
const desserts = reactive([
  {
    name: 'Frozen Yogurt',
    calories: 159,
    fat: 6.0,
    carbs: 24,
    protein: 4.0,
    iron: 1,
  },
  {
    name: 'Ice cream sandwich',
    calories: 237,
    fat: 9.0,
    carbs: 37,
    protein: 4.3,
    iron: 1,
  },

])
function sendPromptToBots() {
  if (prompt.value.trim() === "") return;
  if (Object.values(activeBots).every((bot) => !bot)) return;

  const toBots = bots.value.filter((bot) => activeBots[bot.getClassname()]);

  store.dispatch("sendPrompt", {
    prompt: prompt.value,
    bots: toBots,
  }).then((that) => {
    confirmErrorBot(that)
  })

  // Clear the textarea after sending the prompt
  prompt.value = "";

}
function toggleSelected(botIds) {
  bots_val.map(({ id }) => {
    setBotSelected({ botId: id, selected: botIds.includes(id) })
  })
  checkAllBotsAvailability()
}

function updateActiveBots() {
  for (const bot of bots.value) {
    activeBots[bot.getClassname()] =
      bot.isAvailable() && selectedBots.value[bot.getClassname()];
  }
}

async function checkAllBotsAvailability(specifiedBot = null) {
  try {
    let botsToCheck = bots.value.filter((bot) => store.state.selectedBots[bot.getClassname()])
    if (specifiedBot) {
      // If a bot is specified, only check bots of the same brand
      botsToCheck = botsToCheck.filter(
        (bot) => bot.constructor._brandId === specifiedBot.constructor._brandId,
      );
    }
    const checkAvailabilityPromises = botsToCheck.map((bot) =>
      bot
        .checkAvailability()
        .then(() => updateActiveBots())
        .catch((error) => {
          isMakeAvailableOpen.value = true;
          console.error(
            `Error checking login status for ${bot.getFullname()}:`,
            error,
          );
        }),
    );
    await Promise.allSettled(checkAvailabilityPromises);
  } catch (error) {
    console.error("Error checking login status for bots:", error);
  }
}

function openSettingsModal() {
  isSettingsOpen.value = true;
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

async function clearMessages() {
  const result = await confirmModal.value.showModal(
    i18n.global.t("header.clearMessages"),
  );
  if (result) {
    store.commit("clearMessages");
  }
}
async function confirmErrorBot(that) {
  let failed = []
  Promise.allSettled(that).then(results => {
    for (let result of results) {
      if (result.status === 'fulfilled') {
        // 处理resolve的Promise
      } else {
        // 处理reject的Promise 
        const bot = result.reason
        const fullName = bot.getFullname()
        const classname = bot.getClassname()
        failed.push({ fullName, classname })
      }
    }
    return failed
  }).then(async data => {
    if (data.length) {
      const names = data.map(d => d.fullName).join(',')
      const err = i18n.global.t("error.failedConnectUrl", {
        url: names,
      })
      const msg = i18n.global.t("header.clearBot");
      const result = await confirmModal.value.showModal(
        `${err}\n${msg}`, 500
      );
      if (result) {
        data.forEach(d => {
          setBotSelected({ botId: d.classname, selected: false })
        })
        updateActiveBots()
      }
    }
  })
}

onMounted(() => {
  // Vue.component('VListItemAvatar', VListItemAvatar)
  !store.state.uuid && setUuid(uuidv4());
  window._paq.push(["setUserId", store.state.uuid]);
  // window._paq.push(["trackPageView"]);

  const ver = require("../package.json").version;
  document.title = `ChatALL.ai - v${ver}`;
});

onBeforeMount(() => {
  checkAllBotsAvailability();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Arial", sans-serif;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  padding: 16px;
  z-index: 999;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  height: 40px;
}

.column-icons img {
  opacity: 0.5;
  cursor: pointer;
  width: 24px;
  height: 24px;
  margin: 4px;
}

.bot-logos {
  position: relative;
  top: -120px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.bot-logos img {
  opacity: 0.3;
  width: 36px;
  height: 36px;
  cursor: pointer;
}

img.selected {
  opacity: 1;
}

.content {
  flex: 1;
  background-color: #f3f3f3;
  padding: 16px;
}

footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  box-sizing: border-box;
}

.margin-bottom {
  margin-bottom: 5px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Override default style of vuetify v-textarea */
.v-textarea--auto-grow textarea {
  overflow: auto !important;
}
.filter-table{
  transform: translate(0px, -100px);
}
</style>
