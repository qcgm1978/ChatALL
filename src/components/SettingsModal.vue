<template>
  <v-dialog
    :model-value="props.open"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>{{ $t("settings.title") }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <v-btn icon dark @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-row>
        <v-col cols="2">
          <v-tabs v-model="tab" direction="vertical" color="primary">
            <v-tab value="general">{{ $t("settings.general") }}</v-tab>
            <v-tab value="proxy">{{ $t("proxy.name") }}</v-tab>
            <v-tab value="chat">{{ $t("chat.name") }}</v-tab>
            <v-tab
              v-for="(setting, index) in botSettings"
              :key="index"
              :value="index"
            >
              {{ $t(`${setting.brand}.name`) }}
            </v-tab>
          </v-tabs>
        </v-col>
        <v-col>
          <v-list lines="two" subheader>
            <div v-if="tab == 'general'">
              <v-list-item>
                <v-list-item-title>{{
                  $t("settings.language")
                }}</v-list-item-title>
                <v-select
                  :items="languages"
                  item-title="name"
                  item-value="code"
                  hide-details
                  :model-value="lang"
                  @update:model-value="setCurrentLanguage($event)"
                ></v-select>
                <!-- :true-value="$t('header.yes')"
                :false-value="$t('header.no')" -->
                <v-switch
                  v-model="enableRepliedLang"
                  color="primary"
                  hideDetails="auto"
                  :label="`${$t('settings.enable_replied_lang')}: ${enableRepliedLang}`"
                  inset
                  :true-value="$t('header.yes')"
                  :false-value="$t('header.no')"
                  @update:model-value="setRepliedLang($event)"
                ></v-switch>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{
                  $t("settings.enableScroll")
                }}</v-list-item-title>
                <v-checkbox
                  v-model="enableScroll"
                  color="primary"
                  hideDetails="auto"
                  :label="$t('settings.enable')"
                  @update:model-value="setCurrentScroll($event)"
                ></v-checkbox>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>{{
                  $t("settings.fontSize")
                }}</v-list-item-title>
                <v-text-field
                  v-model="fontSize"
                  label="Number Input"
                  type="number"
                  @update:model-value="setFontSize($event)"
                ></v-text-field>
              </v-list-item>
            </div>
            <div class="section" v-if="tab == 'general'">
              <v-list-item>
                <v-list-item-title>{{
                  $t("settings.theme")
                }}</v-list-item-title>
                <v-select
                  :items="modes"
                  item-title="name"
                  item-value="code"
                  hide-details
                  :model-value="currentMode"
                  @update:model-value="setCurrentMode($event)"
                ></v-select>
              </v-list-item>
            </div>

            <div v-if="tab == 'proxy'">
              <component :is="proxy"></component>
            </div>

            <div v-if="tab == 'chat'">
              <component :is="chat" @close-dialog="closeDialog"></component>
            </div>

            <template v-for="(setting, index) in botSettings" :key="index">
              <component
                v-if="tab == index"
                :is="setting.component"
              ></component>
            </template>
          </v-list>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";

import ProxySettings from "@/components/ProxySetting.vue";
import ChatSettings from "@/components/ChatSetting.vue";

import ChatGPTBotSettings from "@/components/BotSettings/ChatGPTBotSettings.vue";
import OpenAIAPIBotSettings from "@/components/BotSettings/OpenAIAPIBotSettings.vue";
import AzureOpenAIAPIBotSettings from "./BotSettings/AzureOpenAIAPIBotSettings.vue";
import BingChatBotSettings from "@/components/BotSettings/BingChatBotSettings.vue";
import SparkBotSettings from "./BotSettings/SparkBotSettings.vue";
import BardBotSettings from "@/components/BotSettings/BardBotSettings.vue";
import MOSSBotSettings from "@/components/BotSettings/MOSSBotSettings.vue";
import WenxinQianfanBotSettings from "@/components/BotSettings/WenxinQianfanBotSettings.vue";
import GradioAppBotSettings from "@/components/BotSettings/GradioAppBotSettings.vue";
import LMSYSBotSettings from "@/components/BotSettings/LMSYSBotSettings.vue";
import HuggingChatBotSettings from "@/components/BotSettings/HuggingChatBotSettings.vue";
import QianWenBotSettings from "@/components/BotSettings/QianWenBotSettings.vue";
import PoeBotSettings from "@/components/BotSettings/PoeBotSettings.vue";
import SkyWorkBotSettings from "@/components/BotSettings/SkyWorkBotSettings.vue";

import { resolveTheme, applyTheme, Mode } from "../theme";

const { ipcRenderer } = window.require("electron");
const { t: $t, locale } = useI18n();
const store = useStore();
const vuetifyTheme = useTheme();

const props = defineProps(["open"]);
const emit = defineEmits(["update:open", "done"]);

const tab = ref(null);

const botSettings = [
  { brand: "azureOpenaiApi", component: AzureOpenAIAPIBotSettings },
  { brand: "bard", component: BardBotSettings },
  { brand: "bingChat", component: BingChatBotSettings },
  { brand: "chatGpt", component: ChatGPTBotSettings },
  { brand: "gradio", component: GradioAppBotSettings },
  { brand: "huggingChat", component: HuggingChatBotSettings },
  { brand: "lmsys", component: LMSYSBotSettings },
  { brand: "moss", component: MOSSBotSettings },
  { brand: "openaiApi", component: OpenAIAPIBotSettings },
  { brand: "poe", component: PoeBotSettings },
  { brand: "qianWen", component: QianWenBotSettings },
  { brand: "skyWork", component: SkyWorkBotSettings },
  { brand: "spark", component: SparkBotSettings },
  { brand: "wenxinQianfan", component: WenxinQianfanBotSettings },
];

const proxy = ProxySettings;
const chat = ChatSettings;
const languages = computed(() => [
  { name: $t("settings.system"), code: "auto" },
  { name: "Deutsch", code: "de" },
  { name: "English", code: "en" },
  { name: "Español", code: "es" },
  { name: "Français", code: "fr" },
  { name: "Italiano", code: "it" },
  { name: "日本語", code: "ja" },
  { name: "한국어", code: "ko" },
  { name: "Русский", code: "ru" },
  { name: "Tiếng Việt", code: "vi" },
  { name: "简体中文", code: "zh" },
]);

const modes = computed(() => [
  { name: $t("settings.system"), code: Mode.SYSTEM },
  { name: $t("settings.light"), code: Mode.LIGHT },
  { name: $t("settings.dark"), code: Mode.DARK },
]);

const lang = computed(() => store.state.lang);
const enableScroll = computed(() => store.state.enableScroll);
const enableRepliedLang = ref(store.state.enableRepliedLang);
const fontSize = computed(() => store.state.fontSize);
const currentMode = computed(() => store.state.mode);

const setCurrentLanguage = (lan = lang.value) => {
  if (lan == "auto") {
    const lang = navigator.language || navigator.userLanguage || "en";
    lan = lang.substr(0, 2); // Only use the first two characters (e.g. "en")
  }
  const name = languages.value.filter((d) => d.code == lan)[0].name;
  locale.value = lan;
  store.commit("setCurrentLanguage", lan);
  store.commit("setCurrentLanguageName", name);
};
const setCurrentScroll = (scroll) => {
  locale.enableScroll = scroll;
  store.commit("setCurrentScroll", scroll);
};
const setRepliedLang = (enable) => {
  setCurrentLanguage();
  locale.enableRepliedLang = enable;
  store.commit("enableRepliedLang", enable);
};
const setFontSize = (fontSize) => {
  locale.fontSize = fontSize;
  store.commit("setCurrentFontSize", fontSize);
};
const setCurrentMode = async (mode) => {
  const resolvedTheme = await resolveTheme(mode, ipcRenderer);
  store.commit("setMode", mode);
  store.commit("setTheme", resolvedTheme);
  applyTheme(resolvedTheme, vuetifyTheme);
};
const closeDialog = () => {
  emit("update:open", false);
  emit("done");
};
</script>

<style scoped>
:deep() .v-slider-thumb__label {
  color: rgb(var(--v-theme-font));
}

/* Keep the orignal case of tab names */
.v-btn {
  text-transform: none !important;
}
</style>
