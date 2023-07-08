const is_mac = OSnow();
const control = is_mac ? "meta" : "ctrl";
function OSnow() {
  const agent = navigator.userAgent.toLowerCase();
  const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
    console.log("这是windows32位系统");
    return false;
  } else if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
    console.log("这是windows64位系统");
    return false;
  } else if (isMac) {
    console.log("这是Mac系统");
    return true;
  }
}
export const SHORTCUT_PROMPT_TEXTAREA = {
  elementId: "prompt-textarea",
  key: [control, "k"],
  offset: {
    top: 10,
  },
  alignHorizontallyCenter: true,
};

export const SHORTCUT_FIND = {
  elementId: "find-btn",
  key: [control, "f"],
  offset: {
    top: 40,
  },
  flexDirection: "column",
};

export const SHORTCUT_CLEAR_MESSAGES = {
  elementId: "clear-messages-btn",
  key: [control, "e"],
  offset: {
    top: 40,
  },
  flexDirection: "column",
};

export const SHORTCUT_SETTINGS = {
  elementId: "settings-btn",
  key: [control, ","],
  offset: {
    top: 40,
  },
  flexDirection: "column",
};

export const SHORTCUT_SHORTCUT_GUIDE = {
  elementId: "shortcut-guide-btn",
  key: [control, "/"],
  offset: {
    top: 40,
  },
  flexDirection: "column",
};

export const SHORTCUT_BOTS_MENU = {
  elementId: "bots-menu-btn",
  key: ["ctrl", "tab"],
  offset: {
    top: -70,
  },
  flexDirection: "column",
};

export const SHORTCUT_CHAT_DRAWER = {
  elementId: "chat-drawer-btn",
  key: [control, "d"],
  offset: {
    left: -10,
    top: 40,
  },
  flexDirection: "column",
};

export const SHORTCUT_NEW_CHAT = {
  elementId: "new-chat-list-item",
  key: [control, "n"],
  offset: {
    top: 12,
    left: 20,
  },
  alignHorizontallyCenter: true,
};

export const SHORTCUT_LIST = [
  SHORTCUT_FIND,
  SHORTCUT_SETTINGS,
  SHORTCUT_BOTS_MENU,
  SHORTCUT_SHORTCUT_GUIDE,
  SHORTCUT_CLEAR_MESSAGES,
  SHORTCUT_PROMPT_TEXTAREA,
  SHORTCUT_CHAT_DRAWER,
  SHORTCUT_NEW_CHAT,
  {
    elementId: "column-1",
    key: ["f1"],
    offset: {
      top: 30,
      left: -5,
    },
  },
  {
    elementId: "column-2",
    key: ["f2"],
    offset: {
      top: 30,
      left: -5,
    },
  },
  {
    elementId: "column-3",
    key: ["f3"],
    offset: {
      top: 30,
      left: -5,
    },
  },
  {
    elementId: "fav-bot-1",
    key: [control, "1"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-2",
    key: [control, "2"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-3",
    key: [control, "3"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-4",
    key: [control, "4"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-5",
    key: [control, "5"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-6",
    key: [control, "6"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-7",
    key: [control, "7"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-8",
    key: [control, "8"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
  {
    elementId: "fav-bot-9",
    key: [control, "9"],
    offset: {
      top: -70,
    },
    flexDirection: "column",
  },
];
