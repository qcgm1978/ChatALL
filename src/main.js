import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import store from "./store";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { useI18n } from "vue-i18n";
import "material-design-icons/iconfont/material-icons.css";
import VueMatomo from "vue-matomo";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#062AAA",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#062AAA",
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
  .use(VueMatomo, {
    // Configure your matomo server and site by providing
    host: "https://matomo.chatall.ai/",
    siteId: 1,

    // Changes the default .js and .php endpoint's filename
    // Default: 'matomo'
    trackerFileName: "matomo",

    // Overrides the autogenerated tracker endpoint entirely
    // Default: undefined
    // trackerUrl: 'https://example.com/whatever/endpoint/you/have',

    // Overrides the autogenerated tracker script path entirely
    // Default: undefined
    // trackerScriptUrl: 'https://example.com/whatever/script/path/you/have',

    // Enables automatically registering pageviews on the router
    router: null,

    // Enables link tracking on regular links. Note that this won't
    // work for routing links (ie. internal Vue router links)
    // Default: true
    enableLinkTracking: true,

    // Require consent before sending tracking information to matomo
    // Default: false
    requireConsent: false,

    // Whether to track the initial page view
    // Default: true
    trackInitialView: true,

    // Run Matomo without cookies
    // Default: false
    disableCookies: true,

    // Require consent before creating matomo session cookie
    // Default: false
    requireCookieConsent: false,

    // Enable the heartbeat timer (https://developer.matomo.org/guides/tracking-javascript-guide#accurately-measure-the-time-spent-on-each-page)
    // Default: false
    enableHeartBeatTimer: false,

    // Set the heartbeat timer interval
    // Default: 15
    heartBeatTimerInterval: 15,

    // Whether or not to log debug information
    // Default: false
    debug: false,

    // UserID passed to Matomo (see https://developer.matomo.org/guides/tracking-javascript-guide#user-id)
    // Default: undefined
    userId: undefined,

    // Share the tracking cookie across subdomains (see https://developer.matomo.org/guides/tracking-javascript-guide#measuring-domains-andor-sub-domains)
    // Default: undefined, example '*.example.com'
    cookieDomain: undefined,
    // setDomains: [".", "localhost", "127.0.0.1"],
    // enableCrossDomainLinking: true,

    // Tell Matomo the website domain so that clicks on these domains are not tracked as 'Outlinks'
    // Default: undefined, example: '*.example.com'
    domains: "*",

    // A list of pre-initialization actions that run before matomo is loaded
    // Default: []
    // Example: [
    //   ['API_method_name', parameter_list],
    //   ['setCustomVariable','1','VisitorType','Member'],
    //   ['appendToTrackingUrl', 'new_visit=1'],
    //   etc.
    // ]
    preInitActions: [
      [
        "setCustomVariable",
        "1",
        "AppVersion",
        require("../package.json").version,
        "visit",
      ],
    ],

    // A function to determine whether to track an interaction as a site search
    // instead of as a page view. If not a function, all interactions will be
    // tracked as page views. Receives the new route as an argument, and
    // returns either an object of keyword, category (optional) and resultsCount
    // (optional) to track as a site search, or a falsey value to track as a page
    // view.
    // Default: false, i.e. track all interactions as page views
    // Example: (to) => {
    //   if (to.query.q && to.name === 'search') {
    //     return { keyword: to.query.q, category: to.params.category }
    //   } else {
    //    return null
    //   }
    // }
    trackSiteSearch: false,

    // Set this to include crossorigin attribute on the matomo script import
    // Default: undefined, possible values : 'anonymous', 'use-credentials'
    crossOrigin: undefined,
  })
  .mount("#app");
