import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import store from "./store";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { useI18n } from "vue-i18n";
import "material-design-icons/iconfont/material-icons.css";
import { resolveTheme, applyTheme } from "./theme";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const { ipcRenderer } = window.require("electron");

// Init storage
store.commit("init");

const defaultTheme = await resolveTheme(store.state.mode, ipcRenderer);
store.commit("setTheme", defaultTheme);
applyTheme(defaultTheme);

const vuetify = createVuetify({
  locale: {
    adapter: process.env.NODE_ENV !== 'development' && createVueI18nAdapter({ i18n, useI18n }),
  },
  
  components,
  directives,
  theme: {
    defaultTheme: defaultTheme,
    themes: {
      light: {
        colors: {
          primary: "#062AAA",
          surface: "#FFFFFF",
          background: "#f3f3f3",
          "surface-variant": "#fff",
          header: "#fff",
          prompt: "#95ec69",
          response: "#fff",
          "font": "#212121",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#ececf1",
          surface: "#292a2d",
          background: "#1a1a20",
          "surface-variant": "#131419",
          header: "#292a2d",
          prompt: "#222329",
          response: "#131419",
          "font": "#fff",
        },
      },
    },
  },
});

// Inject geetest script for iFlytek Spark
fetch("https://static.geetest.com/g5/gd.js")
  .then((response) => response.text())
  .then((text) => {
    const script = document.createElement("script");
    script.textContent = text;
    document.head.appendChild(script);
  });

createApp(App)
  .use(i18n)
  .use(store)
  .use(vuetify)
  .mount("#app");
