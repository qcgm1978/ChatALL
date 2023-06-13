<template>
  <div id="app">
    <header>
      <div class="header-content">
        <img class="logo" src="@/assets/logo-banner.png" alt="ChatALL" />
        <div class="column-icons">
          <img
            src="@/assets/column-1.svg"
            @click="changeColumns(1)"
            :class="{ selected: columns === 1 }"
          />
          <img
            src="@/assets/column-2.svg"
            @click="changeColumns(2)"
            :class="{ selected: columns === 2 }"
          />
          <img
            src="@/assets/column-3.svg"
            @click="changeColumns(3)"
            :class="{ selected: columns === 3 }"
          />
        </div>
        <div>
          <v-icon
            class="cursor-pointer"
            color="primary"
            icon="mdi-broom"
            size="x-large"
            @click="clearMessages()"
          ></v-icon>
          <v-icon
            class="cursor-pointer"
            color="primary"
            icon="mdi-cog"
            size="x-large"
            @click="openSettingsModal()"
          ></v-icon>
        </div>
      </div>
    </header>

    <main class="content">
      <div id="content">
        <ChatMessages :columns="columns"></ChatMessages>
      </div>
      <!-- <v-card class="filter-table">
        <v-card-title>
          Nutrition
          <v-spacer></v-spacer>
          <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
        </v-card-title>
        <v-data-table :headers="headers" :items="desserts" :search="search"></v-data-table>
      </v-card> -->
    </main>

    <FooterBarSelect v-if="NODE_ENV !== 'development'" :changeColumns="changeColumns" />
    <FooterBar v-else :changeColumns="changeColumns"></FooterBar>
    <SettingsModal
      v-model:open="isSettingsOpen"
    />
    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useStore } from "vuex";
import { v4 as uuidv4 } from "uuid";

import i18n from "./i18n";

// Components
import ChatMessages from "@/components/Messages/ChatMessages.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FooterBarSelect from "@/components/Footer/FooterBarSelect.vue";
import FooterBar from "@/components/Footer/FooterBar.vue";

// Styles
import "@mdi/font/css/materialdesignicons.css";
// import { VDataTable } from 'vuetify/labs/VDataTable'
import _bots from "@/bots";
const store = useStore();
const NODE_ENV = process.env.NODE_ENV;
const confirmModal = ref(null);
const isSettingsOpen = ref(false);
const columns = computed(() => store.state.columns);

const changeColumns = (columns) => store.commit("changeColumns", columns);
const setUuid = (uuid) => store.commit("setUuid", uuid);
const setBotSelected = (uuid) => store.commit("SET_BOT_SELECTED", uuid);
// filter table(https://vuetifyjs.com/en/components/data-tables/filtering/#data-table-filtering)
// const { search, headers, desserts } = set_filter_table();
function set_filter_table() {
  const search = ref("");
  const headers = reactive([
    {
      align: "start",
      key: "name",
      sortable: false,
      title: "Dessert (100g serving)",
    },
    { key: "calories", title: "Calories" },
    { key: "fat", title: "Fat (g)" },
    { key: "carbs", title: "Carbs (g)" },
    { key: "protein", title: "Protein (g)" },
    { key: "iron", title: "Iron (%)" },
  ]);
  const desserts = reactive([
    {
      name: "Frozen Yogurt",
      calories: 159,
      fat: 6.0,
      carbs: 24,
      protein: 4.0,
      iron: 1,
    },
    {
      name: "Ice cream sandwich",
      calories: 237,
      fat: 9.0,
      carbs: 37,
      protein: 4.3,
      iron: 1,
    },
  ]);
  return { search, headers, desserts };
}

function openSettingsModal() {
  isSettingsOpen.value = true;
}

async function clearMessages() {
  const result = await confirmModal.value.showModal(
    i18n.global.t("header.clearMessages"),
  );
  if (result) {
    store.commit("clearMessages");
  }
}

onMounted(() => {
  // Vue.component('VListItemAvatar', VListItemAvatar)
  !store.state.uuid && setUuid(uuidv4());

  const ver = require("../package.json").version;
  document.title = `ChatALL.ai - v${ver}`;
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

img.selected {
  opacity: 1;
}

.content {
  flex: 1;
  background-color: #f3f3f3;
  padding: 16px;
}

.cursor-pointer {
  cursor: pointer;
}

.filter-table {
  transform: translate(0px, -100px);
}
</style>
